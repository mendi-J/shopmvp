const express = require('express');
const { authenticate } = require('../middleware/auth');
const { processPayment } = require('../controllers/paymentController');

const router = express.Router();

router.post('/', authenticate, processPayment);

module.exports = router;
