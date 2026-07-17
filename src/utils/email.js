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


const { google } = require('googleapis');

// Configure the OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground' // Or your specific redirect URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});
      
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
const SENDER_EMAIL = process.env.SMTP_USER;

/**
 * Helper to encode the email into base64url format with both Text and HTML payloads.
 * This structure prevents spam filters from automatically flagging automated emails.
 */
function buildRawEmail(to, subject, htmlBody, textBody) {
  // A unique string boundary to separate text and HTML parts inside the email MIME block
  const boundary = "----=_Part_ExpenseTracker_" + Date.now().toString(16);
  
  const messageParts = [
    `From: "Expense Tracker" <${SENDER_EMAIL}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    textBody,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
    '',
    `--${boundary}--`
  ];

  // Join parts strictly with \r\n as specified by the Internet Message Format standard
  const message = messageParts.join('\r\n');

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Send OTP email
 */
async function sendOtpEmail(to, code) {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 5px;">
        <h2 style="color: #4A90E2; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Your Verification Code</h2>
        <p>Hello,</p>
        <p>We received a request to verify your account for <strong>Expense Tracker</strong>. Please use the verification code below to complete your setup:</p>
        <div style="background-color: #f7f9fb; border: 1px dashed #4A90E2; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0; border-radius: 4px;">
          ${code}
        </div>
        <p style="color: #666; font-size: 14px;">This security code expires in <strong>5 minutes</strong>. If you did not make this request, please safely disregard this message.</p>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">This is an automated operational system email from Expense Tracker.</p>
      </div>
    `;

    const text = `Your Verification Code\n\nHello,\n\nWe received a request to verify your account for Expense Tracker. Please use the verification code below to complete your setup:\n\nCode: ${code}\n\nThis security code expires in 5 minutes. If you did not make this request, please safely disregard this message.\n\n--\nThis is an automated operational system email from Expense Tracker.`;

    const raw = buildRawEmail(to, 'Your OTP Code - Expense Tracker', html, text);

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
    console.log(`OTP email sent via Gmail API to ${to}`);
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
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 5px;">
        <h2 style="color: #D0021B; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your <strong>Expense Tracker</strong> account. If you requested this modification, use the security token provided below:</p>
        <div style="background-color: #f7f9fb; border: 1px solid #e0e0e0; padding: 12px; text-align: center; font-family: monospace; font-size: 16px; font-weight: bold; color: #333; margin: 20px 0; word-break: break-all; border-radius: 4px;">
          ${token}
        </div>
        <p style="color: #666; font-size: 14px;">This reset token will expire in <strong>15 minutes</strong>. If you did not authorize this password reset request, please secure your account immediately or ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">This is an automated operational system email from Expense Tracker.</p>
      </div>
    `;

    const text = `Reset Your Password\n\nHello,\n\nWe received a request to reset your password for your Expense Tracker account. If you requested this modification, use the security token provided below:\n\nToken: ${token}\n\nThis reset token will expire in 15 minutes. If you did not authorize this password reset request, please secure your account immediately or ignore this email.\n\n--\nThis is an automated operational system email from Expense Tracker.`;

    const raw = buildRawEmail(to, 'Password Reset - Expense Tracker', html, text);

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
    console.log(`Reset email sent via Gmail API to ${to}`);
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
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 5px;">
        <h2 style="color: #4A90E2; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Verify Your New Email</h2>
        <p>Hello,</p>
        <p>You have requested to switch your primary profile email address on <strong>Expense Tracker</strong> to this address. To finalize the updates, verify your identity with the token below:</p>
        <div style="background-color: #f7f9fb; border: 1px solid #e0e0e0; padding: 12px; text-align: center; font-family: monospace; font-size: 16px; font-weight: bold; color: #333; margin: 20px 0; word-break: break-all; border-radius: 4px;">
          ${token}
        </div>
        <p style="color: #666; font-size: 14px;">This change request verification token expires in <strong>15 minutes</strong>.</p>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">This is an automated operational system email from Expense Tracker.</p>
      </div>
    `;

    const text = `Verify Your New Email\n\nHello,\n\nYou have requested to switch your primary profile email address on Expense Tracker to this address. To finalize the updates, verify your identity with the token below:\n\nToken: ${token}\n\nThis change request verification token expires in 15 minutes.\n\n--\nThis is an automated operational system email from Expense Tracker.`;

    const raw = buildRawEmail(to, 'Email Change Verification - Expense Tracker', html, text);

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
    console.log(`Email change verification sent via Gmail API to ${to}`);
  } catch (err) {
    console.error('Failed to send email change verification:', err.message);
    console.log(`[DEV] Email change token for ${to}: ${token}`);
  }
}

module.exports = { 
  sendOtpEmail, 
  sendResetEmail, 
  sendEmailChangeVerification 
};