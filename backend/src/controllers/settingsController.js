const crypto = require('crypto');
const prisma = require('../config/prisma');

const getSettings = async (req, res, next) => {
  try {
    let settings = await prisma.userSettings.findUnique({ where: { userId: req.user.id } });

    if (!settings) {
      settings = await prisma.userSettings.create({ data: { userId: req.user.id } });
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { language, emailNotifications, pushNotifications, marketingEmails, profileVisibility, dataSharing } = req.body;

    const data = {};
    if (language !== undefined) data.language = language;
    if (emailNotifications !== undefined) data.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) data.pushNotifications = pushNotifications;
    if (marketingEmails !== undefined) data.marketingEmails = marketingEmails;
    if (profileVisibility !== undefined) data.profileVisibility = profileVisibility;
    if (dataSharing !== undefined) data.dataSharing = dataSharing;

    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user.id },
      update: data,
      create: { userId: req.user.id, ...data },
    });

    res.json({ success: true, message: 'Settings updated', data: settings });
  } catch (error) {
    next(error);
  }
};

const listApiKeys = async (req, res, next) => {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.user.id, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, key: true, lastUsed: true, createdAt: true },
    });

    // Mask all but the last 4 chars of the key
    const masked = keys.map((k) => ({
      ...k,
      key: `sk_...${k.key.slice(-4)}`,
    }));

    res.json({ success: true, data: masked });
  } catch (error) {
    next(error);
  }
};

const generateApiKey = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Key name is required' });
    }

    const activeCount = await prisma.apiKey.count({ where: { userId: req.user.id, revokedAt: null } });
    if (activeCount >= 5) {
      return res.status(400).json({ success: false, message: 'Maximum of 5 API keys allowed. Revoke one first.' });
    }

    const rawKey = `sk_live_${crypto.randomBytes(24).toString('hex')}`;

    const apiKey = await prisma.apiKey.create({
      data: { userId: req.user.id, name: name.trim(), key: rawKey },
    });

    // Return the full key only once at creation
    res.status(201).json({
      success: true,
      message: 'API key created. Copy it now — it will not be shown again.',
      data: { id: apiKey.id, name: apiKey.name, key: rawKey, createdAt: apiKey.createdAt },
    });
  } catch (error) {
    next(error);
  }
};

const revokeApiKey = async (req, res, next) => {
  try {
    const key = await prisma.apiKey.findFirst({
      where: { id: req.params.id, userId: req.user.id, revokedAt: null },
    });

    if (!key) {
      return res.status(404).json({ success: false, message: 'API key not found' });
    }

    await prisma.apiKey.update({
      where: { id: req.params.id },
      data: { revokedAt: new Date() },
    });

    res.json({ success: true, message: 'API key revoked' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings, listApiKeys, generateApiKey, revokeApiKey };
