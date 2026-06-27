const { sendNewsletterConfirmEmail } = require('../services/emailService');
const prisma = require('../config/prisma');

const subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      return res.json({ success: true, message: "You're already subscribed!" });
    }

    await prisma.newsletterSubscriber.create({ data: { email } });
    await sendNewsletterConfirmEmail(email).catch(() => {});

    res.status(201).json({ success: true, message: "You're subscribed! Welcome to ShopMVP." });
  } catch (error) {
    next(error);
  }
};

module.exports = { subscribe };
