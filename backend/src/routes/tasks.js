const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :projectId
const { authenticate } = require('../middleware/auth');
const {
  listTasks, createTask, getTask, updateTask, deleteTask, reorderTasks,
  addComment, updateComment, deleteComment,
  addAttachment, deleteAttachment,
  listLabels, createLabel, deleteLabel,
} = require('../controllers/taskController');

router.use(authenticate);

// Tasks
router.get('/', listTasks);
router.post('/', createTask);
router.patch('/reorder', reorderTasks);
router.get('/:taskId', getTask);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);

// Comments
router.post('/:taskId/comments', addComment);
router.put('/:taskId/comments/:commentId', updateComment);
router.delete('/:taskId/comments/:commentId', deleteComment);

// Attachments
router.post('/:taskId/attachments', addAttachment);
router.delete('/:taskId/attachments/:attachmentId', deleteAttachment);

// Labels (per project)
router.get('/labels/list', listLabels);
router.post('/labels', createLabel);
router.delete('/labels/:labelId', deleteLabel);

module.exports = router;
