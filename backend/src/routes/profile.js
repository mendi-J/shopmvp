const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { getProfile, updateProfile, changePassword, uploadAvatar, deleteAccount } = require('../controllers/profileController');

const router = express.Router();

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
    }
  },
});

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

router.post('/avatar', avatarUpload.single('avatar'), uploadAvatar);

router.delete('/', [
  body('password').notEmpty().withMessage('Password is required'),
], deleteAccount);

module.exports = router;
