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

const sendPasswordResetEmail = async (to, resetUrl, firstName) => {
  if (!process.env.SMTP_USER) {
    console.log(`\n[DEV MODE] Password reset link for ${to}: ${resetUrl}\n`);
    return { messageId: 'dev-mode' };
  }

  const transport = createTransporter();

  const info = await transport.sendMail({
    from: process.env.SMTP_FROM || '"ShopMVP" <noreply@shopmvp.local>',
    to,
    subject: 'Reset Your Password — ShopMVP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="color: #4f46e5; margin: 0 0 8px;">ShopMVP</h2>
          <h3 style="color: #111827; margin: 0 0 24px;">Reset Your Password</h3>
          <p style="color: #6b7280;">Hi ${firstName},</p>
          <p style="color: #6b7280;">Click the button below to reset your password. This link expires in <strong>30 minutes</strong>.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: #4f46e5; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">Reset Password</a>
          </div>
          <p style="color: #9ca3af; font-size: 13px;">If the button doesn't work, copy and paste this link:<br/><a href="${resetUrl}" style="color: #4f46e5;">${resetUrl}</a></p>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });

  return info;
};

const sendNewsletterConfirmEmail = async (to) => {
  if (!process.env.SMTP_USER) {
    console.log(`\n[DEV MODE] Newsletter confirmation for ${to}\n`);
    return;
  }
  const transport = createTransporter();
  await transport.sendMail({
    from: process.env.SMTP_FROM || '"ShopMVP" <noreply@shopmvp.local>',
    to,
    subject: "You're subscribed — ShopMVP",
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#4f46e5">Welcome to ShopMVP updates!</h2><p>You'll receive the latest deals, new arrivals, and exclusive offers directly in your inbox.</p></div>`,
  });
};

const sendOrderConfirmationEmail = async (to, firstName, order) => {
  if (!process.env.SMTP_USER) {
    console.log(`\n[DEV MODE] Order confirmation for ${to}: ${order.orderNumber}\n`);
    return;
  }
  const transport = createTransporter();
  const itemRows = order.items.map((i) =>
    `<tr>
      <td style="padding:8px 0;color:#374151;border-bottom:1px solid #f3f4f6">${i.name}</td>
      <td style="padding:8px 0;color:#374151;text-align:center;border-bottom:1px solid #f3f4f6">×${i.quantity}</td>
      <td style="padding:8px 0;color:#374151;text-align:right;border-bottom:1px solid #f3f4f6">$${(parseFloat(i.price) * i.quantity).toFixed(2)}</td>
    </tr>`
  ).join('');

  await transport.sendMail({
    from: process.env.SMTP_FROM || '"ShopMVP" <noreply@shopmvp.com>',
    to,
    subject: `Order Confirmed — ${order.orderNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb">
        <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <h2 style="color:#4f46e5;margin:0 0 4px">ShopMVP</h2>
          <h3 style="color:#111827;margin:0 0 24px">Order Confirmed!</h3>
          <p style="color:#6b7280">Hi ${firstName}, thanks for your order. We'll keep you updated as it ships.</p>
          <div style="background:#eef2ff;border-radius:8px;padding:16px;margin:20px 0;text-align:center">
            <p style="color:#6b7280;font-size:13px;margin:0 0 4px">Order Number</p>
            <p style="color:#4f46e5;font-size:20px;font-weight:800;margin:0">${order.orderNumber}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <thead><tr>
              <th style="text-align:left;color:#9ca3af;font-size:12px;padding-bottom:8px;border-bottom:2px solid #f3f4f6">Item</th>
              <th style="text-align:center;color:#9ca3af;font-size:12px;padding-bottom:8px;border-bottom:2px solid #f3f4f6">Qty</th>
              <th style="text-align:right;color:#9ca3af;font-size:12px;padding-bottom:8px;border-bottom:2px solid #f3f4f6">Price</th>
            </tr></thead>
            <tbody>${itemRows}</tbody>
          </table>
          <div style="text-align:right;padding-top:12px;border-top:2px solid #f3f4f6">
            <p style="color:#111827;font-size:18px;font-weight:800;margin:0">Total: $${parseFloat(order.totalAmount).toFixed(2)}</p>
          </div>
          <div style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:8px">
            <p style="color:#9ca3af;font-size:12px;font-weight:700;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em">Shipping To</p>
            <p style="color:#374151;margin:0">${order.shippingName}</p>
            <p style="color:#6b7280;font-size:14px;margin:2px 0 0">${order.shippingAddress}, ${order.shippingCity}</p>
          </div>
          <p style="color:#9ca3af;font-size:13px;margin-top:24px">Questions? Reply to this email or visit our <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" style="color:#4f46e5">contact page</a>.</p>
        </div>
      </div>
    `,
  });
};

const sendOrderStatusEmail = async (to, firstName, orderNumber, status) => {
  if (!process.env.SMTP_USER) {
    console.log(`\n[DEV MODE] Order status update for ${to}: ${orderNumber} → ${status}\n`);
    return;
  }

  const statusMessages = {
    PROCESSING: { subject: 'Your order is being processed', headline: 'Order Processing', body: "We've received your order and our team is preparing it for shipment." },
    SHIPPED: { subject: 'Your order has shipped!', headline: 'Order Shipped', body: 'Great news — your order is on its way! You can expect delivery within 3–5 business days.' },
    DELIVERED: { subject: 'Your order has been delivered', headline: 'Order Delivered', body: "Your order has been delivered. We hope you love it! Leave a review to help other shoppers." },
    CANCELLED: { subject: 'Your order has been cancelled', headline: 'Order Cancelled', body: 'Your order has been cancelled. If you paid, a refund will be processed within 3–5 business days.' },
  };

  const msg = statusMessages[status] || { subject: `Order update: ${status}`, headline: status, body: `Your order ${orderNumber} has been updated to ${status}.` };
  const transport = createTransporter();

  await transport.sendMail({
    from: process.env.SMTP_FROM || '"ShopMVP" <noreply@shopmvp.com>',
    to,
    subject: `${msg.subject} — ${orderNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb">
        <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
          <h2 style="color:#4f46e5;margin:0 0 4px">ShopMVP</h2>
          <h3 style="color:#111827;margin:0 0 24px">${msg.headline}</h3>
          <p style="color:#6b7280">Hi ${firstName},</p>
          <p style="color:#6b7280">${msg.body}</p>
          <div style="background:#eef2ff;border-radius:8px;padding:16px;margin:20px 0;text-align:center">
            <p style="color:#6b7280;font-size:13px;margin:0 0 4px">Order Number</p>
            <p style="color:#4f46e5;font-size:20px;font-weight:800;margin:0">${orderNumber}</p>
          </div>
          <div style="text-align:center;margin-top:24px">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders" style="background:#4f46e5;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">View My Orders</a>
          </div>
        </div>
      </div>
    `,
  });
};

module.exports = { sendOTPEmail, sendPasswordResetEmail, sendNewsletterConfirmEmail, sendOrderConfirmationEmail, sendOrderStatusEmail };
