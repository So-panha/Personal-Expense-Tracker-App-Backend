// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST || 'smtp.gmail.com',
//   port: parseInt(process.env.SMTP_PORT || ' '),
//   secure: false,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// /**
//  * Send OTP email
//  */
// async function sendOtpEmail(to, code) {
//   try {
//     await transporter.sendMail({
//       // from: process.env.SMTP_USER || 'noreply@expense-tracker.com',
//       from: 'expense-tracker@gmail.com',
//       to,
//       subject: 'Your OTP Code - Expense Tracker',
//       html: `
//         <h2>Your Verification Code</h2>
//         <p>Your OTP code is: <strong>${code}</strong></p>
//         <p>This code expires in 5 minutes.</p>
//       `,
//     });
//     console.log(`OTP email sent to ${to}`);
//   } catch (err) {
//     console.error('Failed to send OTP email:', err.message);
//     // Don't throw — log the OTP to console so dev can still use it
//     console.log(`[DEV] OTP for ${to}: ${code}`);
//   }
// }

// /**
//  * Send password reset email
//  */
// async function sendResetEmail(to, token) {
//   try {
//     await transporter.sendMail({
//       from: 'expense-tracker@gmail.com',
//       to,
//       subject: 'Password Reset - Expense Tracker',
//       html: `
//         <h2>Reset Your Password</h2>
//         <p>Your password reset token is: <strong>${token}</strong></p>
//         <p>This token expires in 15 minutes.</p>
//       `,
//     });
//     console.log(`Reset email sent to ${to}`);
//   } catch (err) {
//     console.error('Failed to send reset email:', err.message);
//     console.log(`[DEV] Reset token for ${to}: ${token}`);
//   }
// }

// /**
//  * Send email change verification
//  */
// async function sendEmailChangeVerification(to, token) {
//   try {
//     await transporter.sendMail({
//       from: 'expense-tracker@gmail.com',
//       to,
//       subject: 'Email Change Verification - Expense Tracker',
//       html: `
//         <h2>Verify Your New Email</h2>
//         <p>Your verification token is: <strong>${token}</strong></p>
//         <p>This token expires in 15 minutes.</p>
//       `,
//     });
//     console.log(`Email change verification sent to ${to}`);
//   } catch (err) {
//     console.error('Failed to send email change verification:', err.message);
//     console.log(`[DEV] Email change token for ${to}: ${token}`);
//   }
// }

// module.exports = { sendOtpEmail, sendResetEmail, sendEmailChangeVerification };



// const { Resend } = require('resend');

// // Initialize Resend with your API key from environment variables
// const resend = new Resend(process.env.RESEND_API_KEY);

// // Use a verified domain if you have one, or Resend's default testing address.
// // Note: 'onboarding@resend.dev' can ONLY send to your own registered Resend email.
// const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

// /**
//  * Send OTP email
//  */
// async function sendOtpEmail(to, code) {
//   try {
//     await resend.emails.send({
//       from: SENDER_EMAIL,
//       to: to,
//       subject: 'Your OTP Code - Expense Tracker',
//       html: `
//         <h2>Your Verification Code</h2>
//         <p>Your OTP code is: <strong>${code}</strong></p>
//         <p>This code expires in 5 minutes.</p>
//       `,
//     });
//     console.log(`OTP email sent to ${to}`);
//   } catch (err) {
//     console.error('Failed to send OTP email:', err.message);
//     // Don't throw — log the OTP to console so dev can still use it
//     console.log(`[DEV] OTP for ${to}: ${code}`);
//   }
// }

// /**
//  * Send password reset email
//  */
// async function sendResetEmail(to, token) {
//   try {
//     await resend.emails.send({
//       from: SENDER_EMAIL,
//       to: to,
//       subject: 'Password Reset - Expense Tracker',
//       html: `
//         <h2>Reset Your Password</h2>
//         <p>Your password reset token is: <strong>${token}</strong></p>
//         <p>This token expires in 15 minutes.</p>
//       `,
//     });
//     console.log(`Reset email sent to ${to}`);
//   } catch (err) {
//     console.error('Failed to send reset email:', err.message);
//     console.log(`[DEV] Reset token for ${to}: ${token}`);
//   }
// }

// /**
//  * Send email change verification
//  */
// async function sendEmailChangeVerification(to, token) {
//   try {
//     await resend.emails.send({
//       from: SENDER_EMAIL,
//       to: to,
//       subject: 'Email Change Verification - Expense Tracker',
//       html: `
//         <h2>Verify Your New Email</h2>
//         <p>Your verification token is: <strong>${token}</strong></p>
//         <p>This token expires in 15 minutes.</p>
//       `,
//     });
//     console.log(`Email change verification sent to ${to}`);
//   } catch (err) {
//     console.error('Failed to send email change verification:', err.message);
//     console.log(`[DEV] Email change token for ${to}: ${token}`);
//   }
// }

// module.exports = { sendOtpEmail, sendResetEmail, sendEmailChangeVerification };


const nodemailer = require('nodemailer');

// Configure the transporter using Gmail API (OAuth2)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.SMTP_USER, // Your gmail (e.g. example@gmail.com)
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});

const SENDER_EMAIL = process.env.SMTP_USER;

/**
 * Send OTP email
 */
async function sendOtpEmail(to, code) {
  try {
    await transporter.sendMail({
      from: `"Expense Tracker" <${SENDER_EMAIL}>`,
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
    console.log(`[DEV] OTP for ${to}: ${code}`);
  }
}

/**
 * Send password reset email
 */
async function sendResetEmail(to, token) {
  try {
    await transporter.sendMail({
      from: `"Expense Tracker" <${SENDER_EMAIL}>`,
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
      from: `"Expense Tracker" <${SENDER_EMAIL}>`,
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