const express = require('express');
const router = express.Router();
const { list, add, remove } = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, list);
router.post('/', authenticate, add);
router.delete('/:productId', authenticate, remove);

module.exports = router;
