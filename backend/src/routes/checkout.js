const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { createCheckout } = require('../controllers/checkoutController');

const router = express.Router();

router.post('/', authenticate, [
  body('shippingName').trim().notEmpty().withMessage('Shipping name is required'),
  body('shippingPhone').trim().notEmpty().withMessage('Shipping phone is required'),
  body('shippingAddress').trim().notEmpty().withMessage('Shipping address is required'),
  body('shippingCity').trim().notEmpty().withMessage('Shipping city is required'),
], createCheckout);

module.exports = router;
