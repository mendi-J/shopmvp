const express = require('express');
const { adminAuth } = require('../middleware/adminAuth');
const {
  getDashboard,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/adminController');

const router = express.Router();

router.use(adminAuth);

router.get('/dashboard', getDashboard);
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.patch('/orders/:id/status', updateOrderStatus);

module.exports = router;
