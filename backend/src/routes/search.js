const express = require('express');
const router = express.Router();
const { globalSearch, getSavedSearches, saveSearch, deleteSavedSearch } = require('../controllers/searchController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, globalSearch);
router.get('/saved', authenticate, getSavedSearches);
router.post('/saved', authenticate, saveSearch);
router.delete('/saved/:id', authenticate, deleteSavedSearch);

module.exports = router;
