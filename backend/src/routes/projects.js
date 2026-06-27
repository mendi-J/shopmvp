const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  list, create, getById, update, archive, remove,
  listMembers, inviteMember, updateMemberRole, removeMember,
} = require('../controllers/projectController');

router.use(authenticate);

router.get('/', list);
router.post('/', create);
router.get('/:id', getById);
router.put('/:id', update);
router.patch('/:id/archive', archive);
router.delete('/:id', remove);

router.get('/:id/members', listMembers);
router.post('/:id/members', inviteMember);
router.put('/:id/members/:userId', updateMemberRole);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
