const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send OTP email
 */
async function sendOtpEmail(to, code) {
  try {
    await transporter.sendMail({
      // from: process.env.SMTP_USER || 'noreply@expense-tracker.com',
      from: 'expense-tracker@gmail.com',
      to,
      subject: 'Your OTP Code - Expense Tracker',
      html: `
        <h2>Your Verification Code</h2>
        <p>Your OTP code is: <strong>${code}</strong></p>
        <p>This code expires in 5 minutes.</p>
      `,
    });
    console.log(`OTP email sent to ${to}`);
  } catch (err) {
    console.error('Failed to send OTP email:', err.message);
    // Don't throw — log the OTP to console so dev can still use it
    console.log(`[DEV] OTP for ${to}: ${code}`);
  }
}

/**
 * Send password reset email
 */
async function sendResetEmail(to, token) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER || 'noreply@expense-tracker.com',
      to,
      subject: 'Password Reset - Expense Tracker',
      html: `
        <h2>Reset Your Password</h2>
        <p>Your password reset token is: <strong>${token}</strong></p>
        <p>This token expires in 15 minutes.</p>
      `,
    });
    console.log(`Reset email sent to ${to}`);
  } catch (err) {
    console.error('Failed to send reset email:', err.message);
    console.log(`[DEV] Reset token for ${to}: ${token}`);
  }
}

/**
 * Send email change verification
 */
async function sendEmailChangeVerification(to, token) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER || 'noreply@expense-tracker.com',
      to,
      subject: 'Email Change Verification - Expense Tracker',
      html: `
        <h2>Verify Your New Email</h2>
        <p>Your verification token is: <strong>${token}</strong></p>
        <p>This token expires in 15 minutes.</p>
      `,
    });
    console.log(`Email change verification sent to ${to}`);
  } catch (err) {
    console.error('Failed to send email change verification:', err.message);
    console.log(`[DEV] Email change token for ${to}: ${token}`);
  }
}

module.exports = { sendOtpEmail, sendResetEmail, sendEmailChangeVerification };
