const nodemailer = require('nodemailer');

let transporter;

const createTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT) || 2525,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const sendOTPEmail = async (to, otp, firstName) => {
  if (!process.env.SMTP_USER) {
    console.log(`\n[DEV MODE] OTP for ${to}: ${otp}\n`);
    return { messageId: 'dev-mode', preview: `OTP: ${otp}` };
  }

  const transport = createTransporter();

  const info = await transport.sendMail({
    from: process.env.SMTP_FROM || '"ShopMVP" <noreply@shopmvp.com>',
    to,
    subject: 'Your Verification Code — ShopMVP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="color: #4f46e5; margin: 0 0 8px;">ShopMVP</h2>
          <h3 style="color: #111827; margin: 0 0 24px;">Verify Your Account</h3>
          <p style="color: #6b7280;">Hi ${firstName},</p>
          <p style="color: #6b7280;">Your verification code is:</p>
          <div style="background: #eef2ff; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #4f46e5;">${otp}</span>
          </div>
          <p style="color: #6b7280;">This code expires in <strong>5 minutes</strong>. Max 3 attempts.</p>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `,
  });

  return info;
};

module.exports = { sendOTPEmail };
