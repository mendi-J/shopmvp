const express = require('express');
const router = express.Router();
const { list, markRead, markAllRead, dismiss } = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, list);
router.post('/read-all', authenticate, markAllRead);
router.patch('/:id/read', authenticate, markRead);
router.delete('/:id', authenticate, dismiss);

module.exports = router;
