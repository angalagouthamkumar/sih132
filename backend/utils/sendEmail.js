import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Configure Nodemailer transport dynamically to guarantee env vars are loaded
 */
const getTransporter = () => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASS;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Send 6-digit OTP email to user's Gmail address
 * @param {string} toEmail Recipient email address
 * @param {string} otpCode 6-digit numeric OTP
 * @param {Object|string} [options] Optional config or 'signup' flag
 */
export const sendOTPEmail = async (toEmail, otpCode, options = {}) => {
  const isSignup = typeof options === 'string' ? options === 'signup' : options?.isSignup;
  const title = isSignup ? 'Account Registration Verification' : 'Password Reset Request';
  const subtitle = isSignup
    ? 'Use the following 6-digit OTP code to verify your Gmail address and complete your registration:'
    : 'Use the following 6-digit OTP code to complete your password reset:';
  const subject = isSignup
    ? 'Your Signup Verification OTP Code'
    : 'Your Password Reset OTP Code';

  const transporter = getTransporter();

  const mailOptions = {
    from: `"SIH Platform" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #2c3e50; text-align: center;">${title}</h2>
        <p>${subtitle}</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #27ae60; background: #f4f9f4; padding: 10px 20px; border-radius: 5px;">${otpCode}</span>
        </div>
        <p style="color: #7f8c8d; font-size: 13px;">This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

export const sendEmail = sendOTPEmail;
export default sendOTPEmail;
