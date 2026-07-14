const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { success, error } = require('../utils/response');
const { generateOtp } = require('../utils/otp');
const { sendOtpEmail, sendResetEmail, sendEmailChangeVerification } = require('../utils/email');
const crypto = require('crypto');

// Helper: create JWT
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Helper: format user for response
function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatar: user.avatar,
  };
}

// POST /auth/register
exports.register = async (req, res, next) => {
  try {
    const { email, password, confirmPassword, fullName } = req.body;

    if (!email || !password || !fullName) {
      return error(res, 'Email, password, and fullName are required', 400);
    }
    if (password !== confirmPassword) {
      return error(res, 'Passwords do not match', 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return error(res, 'Email already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, fullName },
    });

    // Create default categories for standard user
    const defaultCategories = [
      { name: 'Salary', type: 'INCOME', isSystem: true },
      { name: 'Business', type: 'INCOME', isSystem: true },
      { name: 'Rent', type: 'EXPENSE', isSystem: true },
      { name: 'Food & Drinks', type: 'EXPENSE', isSystem: true },
      { name: 'Shopping', type: 'EXPENSE', isSystem: true },
      { name: 'Transportation', type: 'EXPENSE', isSystem: true },
      { name: 'Entertainment', type: 'EXPENSE', isSystem: true },
    ];
    for (const cat of defaultCategories) {
      await prisma.category.create({
        data: {
          name: cat.name,
          type: cat.type,
          isSystem: cat.isSystem,
          userId: user.id,
        },
      });
    }

    return success(res, formatUser(user), 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
};

// POST /auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'Email and password are required', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return error(res, 'Invalid email or password', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return error(res, 'Invalid email or password', 401);
    }

    const token = signToken(user);
    return success(res, { token, user: formatUser(user) }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// DELETE /auth/logout
exports.logout = async (req, res, next) => {
  try {
    // In a production app you'd blacklist the token.
    // For now, the client simply discards the token.
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

// GET /auth/profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return error(res, 'User not found', 404);
    return success(res, formatUser(user), 'Profile retrieved');
  } catch (err) {
    next(err);
  }
};

// PUT /auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName } = req.body;
    if (!fullName) return error(res, 'fullName is required', 400);

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { fullName },
    });
    return success(res, formatUser(user), 'Profile updated');
  } catch (err) {
    next(err);
  }
};

// PUT /auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return error(res, 'currentPassword and newPassword are required', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return error(res, 'Current password is incorrect', 400);

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed },
    });
    return success(res, null, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};

// POST /auth/change-email/request
exports.requestChangeEmail = async (req, res, next) => {
  try {
    const { newEmail, password } = req.body;
    if (!newEmail || !password) {
      return error(res, 'newEmail and password are required', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return error(res, 'Incorrect password', 400);

    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing) return error(res, 'Email already in use', 409);

    // Generate a token and store in OTP table
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.otp.create({
      data: {
        email: newEmail,
        code: token,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
        userId: req.user.id,
      },
    });

    await sendEmailChangeVerification(newEmail, token);
    return success(res, null, 'Verification email sent to new address');
  } catch (err) {
    next(err);
  }
};

// POST /auth/change-email/verify
exports.verifyNewEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return error(res, 'Token is required', 400);

    const otpRecord = await prisma.otp.findFirst({
      where: { code: token, expiresAt: { gt: new Date() } },
    });
    if (!otpRecord) return error(res, 'Invalid or expired token', 400);

    await prisma.user.update({
      where: { id: otpRecord.userId },
      data: { email: otpRecord.email },
    });

    await prisma.otp.delete({ where: { id: otpRecord.id } });
    return success(res, null, 'Email changed successfully');
  } catch (err) {
    next(err);
  }
};

// PUT /auth/profile/avatar
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'No file uploaded', 400);

    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: avatarUrl },
    });
    return success(res, formatUser(user), 'Avatar uploaded');
  } catch (err) {
    next(err);
  }
};

// DELETE /auth/profile/avatar
exports.deleteAvatar = async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: null },
    });
    return success(res, formatUser(user), 'Avatar deleted');
  } catch (err) {
    next(err);
  }
};

// POST /otp/send
exports.sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return error(res, 'Email is required', 400);

    const code = generateOtp();
    await prisma.otp.create({
      data: {
        email,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
      },
    });

    await sendOtpEmail(email, code);
    return success(res, null, 'OTP sent successfully');
  } catch (err) {
    next(err);
  }
};

// POST /otp/verify
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return error(res, 'Email and code are required', 400);

    const otpRecord = await prisma.otp.findFirst({
      where: {
        email,
        code,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) return error(res, 'Invalid or expired OTP', 400);

    // Mark user as verified if exists
    await prisma.user.updateMany({
      where: { email },
      data: { emailVerified: true },
    });

    await prisma.otp.delete({ where: { id: otpRecord.id } });
    return success(res, null, 'OTP verified successfully');
  } catch (err) {
    next(err);
  }
};

// POST /auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return error(res, 'Email is required', 400);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return success(res, null, 'If the email exists, a reset link has been sent');
    }

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.otp.create({
      data: {
        email,
        code: token,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        userId: user.id,
      },
    });

    await sendResetEmail(email, token);
    return success(res, null, 'If the email exists, a reset link has been sent');
  } catch (err) {
    next(err);
  }
};

// POST /auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return error(res, 'Token and newPassword are required', 400);
    }

    const otpRecord = await prisma.otp.findFirst({
      where: { code: token, expiresAt: { gt: new Date() } },
    });
    if (!otpRecord) return error(res, 'Invalid or expired token', 400);

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: otpRecord.userId },
      data: { password: hashed },
    });

    await prisma.otp.delete({ where: { id: otpRecord.id } });
    return success(res, null, 'Password reset successfully');
  } catch (err) {
    next(err);
  }
};

// POST /auth/google
exports.loginWithGoogle = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return error(res, 'idToken is required', 400);

    // Verify Google ID token using Google tokeninfo API
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) {
      return error(res, 'Invalid Google ID token', 400);
    }
    const payload = await response.json();
    const { email, name, picture } = payload;

    if (!email) {
      return error(res, 'Email not provided by Google account', 400);
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Generate a secure random password to satisfy Prisma constraint
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 12);

      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName: name || email.split('@')[0],
          avatar: picture || null,
          emailVerified: true,
        },
      });

      // Create default categories for new social user
      const defaultCategories = [
        { name: 'Salary', type: 'INCOME', isSystem: true },
        { name: 'Business', type: 'INCOME', isSystem: true },
        { name: 'Rent', type: 'EXPENSE', isSystem: true },
        { name: 'Food & Drinks', type: 'EXPENSE', isSystem: true },
        { name: 'Shopping', type: 'EXPENSE', isSystem: true },
        { name: 'Transportation', type: 'EXPENSE', isSystem: true },
        { name: 'Entertainment', type: 'EXPENSE', isSystem: true },
      ];
      for (const cat of defaultCategories) {
        await prisma.category.create({
          data: {
            name: cat.name,
            type: cat.type,
            isSystem: cat.isSystem,
            userId: user.id,
          },
        });
      }
    }

    const token = signToken(user);
    return success(res, { token, user: formatUser(user) }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// POST /auth/facebook
exports.loginWithFacebook = async (req, res, next) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return error(res, 'accessToken is required', 400);

    // Verify Facebook access token using Graph API
    const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`);
    if (!response.ok) {
      return error(res, 'Invalid Facebook access token', 400);
    }
    const payload = await response.json();
    const { email, name } = payload;
    const avatar = payload.picture?.data?.url || null;

    if (!email) {
      return error(res, 'Email not provided by Facebook account', 400);
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Generate a secure random password to satisfy Prisma constraint
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 12);

      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName: name || email.split('@')[0],
          avatar,
          emailVerified: true,
        },
      });

      // Create default categories for new social user
      const defaultCategories = [
        { name: 'Salary', type: 'INCOME', isSystem: true },
        { name: 'Business', type: 'INCOME', isSystem: true },
        { name: 'Rent', type: 'EXPENSE', isSystem: true },
        { name: 'Food & Drinks', type: 'EXPENSE', isSystem: true },
        { name: 'Shopping', type: 'EXPENSE', isSystem: true },
        { name: 'Transportation', type: 'EXPENSE', isSystem: true },
        { name: 'Entertainment', type: 'EXPENSE', isSystem: true },
      ];
      for (const cat of defaultCategories) {
        await prisma.category.create({
          data: {
            name: cat.name,
            type: cat.type,
            isSystem: cat.isSystem,
            userId: user.id,
          },
        });
      }
    }

    const token = signToken(user);
    return success(res, { token, user: formatUser(user) }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

