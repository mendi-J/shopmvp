const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getOrderById, getMyOrders } = require('../controllers/orderController');

const router = express.Router();

router.use(authenticate);

router.get('/', getMyOrders);
router.get('/:id', getOrderById);

module.exports = router;
