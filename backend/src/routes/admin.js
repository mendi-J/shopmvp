const express = require('express');
const { adminAuth } = require('../middleware/adminAuth');
const {
  getDashboard,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  listProducts,
  createProduct,
  updateProduct,
  toggleProduct,
  deleteProduct,
  listUsers,
  getUser,
  toggleUserRole,
} = require('../controllers/adminController');

const router = express.Router();

router.use(adminAuth);

// Dashboard
router.get('/dashboard', getDashboard);

// Orders
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.patch('/orders/:id/status', updateOrderStatus);

// Products
router.get('/products', listProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.patch('/products/:id/toggle', toggleProduct);
router.delete('/products/:id', deleteProduct);

// Users
router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id/role', toggleUserRole);

module.exports = router;
