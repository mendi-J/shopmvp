const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const prisma = require('../config/prisma');

const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { firstName, lastName, email, phone } = req.body;

    if (email && email !== req.user.email) {
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id: req.user.id } },
      });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already in use by another account' });
      }
    }

    if (phone && phone !== req.user.phone) {
      const existing = await prisma.user.findFirst({
        where: { phone, NOT: { id: req.user.id } },
      });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Phone number already in use by another account' });
      }
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { id: true, email: true, phone: true, firstName: true, lastName: true },
    });

    res.json({ success: true, message: 'Profile updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password must be different from current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, changePassword };
