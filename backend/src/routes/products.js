const express = require('express');
const { getProducts, getProductById, searchProducts } = require('../controllers/productController');

const router = express.Router();

router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/:id', getProductById);

module.exports = router;
