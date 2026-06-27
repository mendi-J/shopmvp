const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, listApiKeys, generateApiKey, revokeApiKey } = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getSettings);
router.put('/', authenticate, updateSettings);
router.get('/api-keys', authenticate, listApiKeys);
router.post('/api-keys', authenticate, generateApiKey);
router.delete('/api-keys/:id', authenticate, revokeApiKey);

module.exports = router;
