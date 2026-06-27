const express = require('express');
const { body } = require('express-validator');
const { register, verifyOTP, login, resendOTP, forgotPassword, resetPassword } = require('../controllers/authController');

const router = express.Router();

router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Invalid phone number'),
], register);

router.post('/verify-otp', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('code').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be a 6-digit number'),
], verifyOTP);

router.post('/login', [
  body('password').notEmpty().withMessage('Password is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Invalid phone number'),
], login);

router.post('/resend-otp', resendOTP);

router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
], forgotPassword);

router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], resetPassword);

module.exports = router;
