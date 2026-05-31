const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { getProfile, updateProfile, changePassword } = require('../controllers/profileController');

const router = express.Router();

router.use(authenticate);

router.get('/', getProfile);

router.put('/', [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email format'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Invalid phone number'),
], updateProfile);

router.put('/password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
], changePassword);

module.exports = router;
