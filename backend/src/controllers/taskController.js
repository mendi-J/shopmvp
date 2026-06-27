const multer = require('multer');
const streamifier = require('streamifier');
const prisma = require('../config/prisma');
const cloudinary = require('../config/cloudinary');

const TASK_SELECT = {
  id: true, title: true, description: true, status: true, priority: true,
  dueDate: true, position: true, createdAt: true, updatedAt: true,
  assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
  reporter: { select: { id: true, firstName: true, lastName: true, avatar: true } },
  labels: { select: { label: { select: { id: true, name: true, color: true } } } },
  _count: { select: { comments: true, attachments: true } },
};

const assertProjectMember = async (projectId, userId) => {
  const m = await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId } } });
  if (!m) throw Object.assign(new Error('Access denied'), { status: 403 });
  return m;
};

// ─── Tasks ────────────────────────────────────────────────────────────────

const listTasks = async (req, res, next) => {
  try {
    await assertProjectMember(req.params.projectId, req.user.id);
    const { status } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        projectId: req.params.projectId,
        ...(status && { status }),
      },
      select: TASK_SELECT,
      orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
    });

    // Group by status for Kanban
    const columns = { TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] };
    tasks.forEach((t) => { if (columns[t.status]) columns[t.status].push(t); });

    res.json({ success: true, data: { tasks, columns } });
  } catch (error) { next(error); }
};

const createTask = async (req, res, next) => {
  try {
    await assertProjectMember(req.params.projectId, req.user.id);
    const { title, description, status = 'TODO', priority = 'MEDIUM', assigneeId, dueDate, labelIds } = req.body;
    if (!title?.trim()) return res.status(400).json({ success: false, message: 'Task title is required' });

    const maxPos = await prisma.task.aggregate({
      _max: { position: true },
      where: { projectId: req.params.projectId, status },
    });

    const task = await prisma.task.create({
      data: {
        projectId: req.params.projectId,
        title: title.trim(),
        description: description?.trim() || null,
        status,
        priority,
        reporterId: req.user.id,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        position: (maxPos._max.position ?? -1) + 1,
        labels: labelIds?.length
          ? { create: labelIds.map((labelId) => ({ labelId })) }
          : undefined,
      },
      select: TASK_SELECT,
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) { next(error); }
};

const getTask = async (req, res, next) => {
  try {
    await assertProjectMember(req.params.projectId, req.user.id);

    const task = await prisma.task.findFirst({
      where: { id: req.params.taskId, projectId: req.params.projectId },
      select: {
        ...TASK_SELECT,
        comments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true, body: true, createdAt: true, updatedAt: true,
            author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, filename: true, url: true, size: true, mimeType: true, createdAt: true,
            uploader: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (error) { next(error); }
};

const updateTask = async (req, res, next) => {
  try {
    const m = await assertProjectMember(req.params.projectId, req.user.id);
    const { title, description, status, priority, assigneeId, dueDate, labelIds } = req.body;

    // Only assignee, reporter, ADMIN, or OWNER can edit
    const task = await prisma.task.findFirst({ where: { id: req.params.taskId, projectId: req.params.projectId } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const canEdit = task.reporterId === req.user.id || task.assigneeId === req.user.id
      || m.role === 'OWNER' || m.role === 'ADMIN';
    if (!canEdit) return res.status(403).json({ success: false, message: 'Insufficient permissions' });

    const updated = await prisma.task.update({
      where: { id: req.params.taskId },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(labelIds !== undefined && {
          labels: {
            deleteMany: {},
            create: labelIds.map((labelId) => ({ labelId })),
          },
        }),
      },
      select: TASK_SELECT,
    });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
};

const deleteTask = async (req, res, next) => {
  try {
    const m = await assertProjectMember(req.params.projectId, req.user.id);
    const task = await prisma.task.findFirst({ where: { id: req.params.taskId, projectId: req.params.projectId } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const canDelete = task.reporterId === req.user.id || m.role === 'OWNER' || m.role === 'ADMIN';
    if (!canDelete) return res.status(403).json({ success: false, message: 'Insufficient permissions' });

    await prisma.task.delete({ where: { id: req.params.taskId } });
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) { next(error); }
};

const reorderTasks = async (req, res, next) => {
  try {
    await assertProjectMember(req.params.projectId, req.user.id);
    const { taskId, newStatus, newPosition } = req.body;

    const task = await prisma.task.findFirst({ where: { id: taskId, projectId: req.params.projectId } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Shift positions of sibling tasks
    if (newStatus !== task.status) {
      await prisma.task.updateMany({
        where: { projectId: req.params.projectId, status: task.status, position: { gt: task.position } },
        data: { position: { decrement: 1 } },
      });
      await prisma.task.updateMany({
        where: { projectId: req.params.projectId, status: newStatus, position: { gte: newPosition } },
        data: { position: { increment: 1 } },
      });
    } else {
      const min = Math.min(task.position, newPosition);
      const max = Math.max(task.position, newPosition);
      const dir = newPosition < task.position ? 1 : -1;
      await prisma.task.updateMany({
        where: { projectId: req.params.projectId, status: newStatus, position: { gte: min, lte: max }, id: { not: taskId } },
        data: { position: { increment: dir } },
      });
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus, position: newPosition },
      select: TASK_SELECT,
    });

    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
};

// ─── Comments ─────────────────────────────────────────────────────────────

const addComment = async (req, res, next) => {
  try {
    await assertProjectMember(req.params.projectId, req.user.id);
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ success: false, message: 'Comment body is required' });

    const task = await prisma.task.findFirst({ where: { id: req.params.taskId, projectId: req.params.projectId } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const comment = await prisma.taskComment.create({
      data: { taskId: req.params.taskId, authorId: req.user.id, body: body.trim() },
      select: {
        id: true, body: true, createdAt: true, updatedAt: true,
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });
    res.status(201).json({ success: true, data: comment });
  } catch (error) { next(error); }
};

const updateComment = async (req, res, next) => {
  try {
    await assertProjectMember(req.params.projectId, req.user.id);
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ success: false, message: 'Comment body is required' });

    const comment = await prisma.taskComment.findFirst({
      where: { id: req.params.commentId, taskId: req.params.taskId },
    });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.authorId !== req.user.id) return res.status(403).json({ success: false, message: 'Can only edit your own comments' });

    const updated = await prisma.taskComment.update({
      where: { id: req.params.commentId },
      data: { body: body.trim() },
      select: { id: true, body: true, createdAt: true, updatedAt: true },
    });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
};

const deleteComment = async (req, res, next) => {
  try {
    const m = await assertProjectMember(req.params.projectId, req.user.id);
    const comment = await prisma.taskComment.findFirst({ where: { id: req.params.commentId, taskId: req.params.taskId } });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const canDelete = comment.authorId === req.user.id || m.role === 'OWNER' || m.role === 'ADMIN';
    if (!canDelete) return res.status(403).json({ success: false, message: 'Insufficient permissions' });

    await prisma.taskComment.delete({ where: { id: req.params.commentId } });
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) { next(error); }
};

// ─── Attachments ──────────────────────────────────────────────────────────

const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
}).single('file');

const addAttachment = async (req, res, next) => {
  attachmentUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    try {
      await assertProjectMember(req.params.projectId, req.user.id);
      const task = await prisma.task.findFirst({ where: { id: req.params.taskId, projectId: req.params.projectId } });
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

      // Upload to Cloudinary as raw resource so any file type is accepted
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'shopmvp/attachments', resource_type: 'auto', public_id: `task_${req.params.taskId}_${Date.now()}` },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      const attachment = await prisma.taskAttachment.create({
        data: {
          taskId: req.params.taskId,
          uploaderId: req.user.id,
          filename: req.file.originalname,
          url: result.secure_url,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
        select: {
          id: true, filename: true, url: true, size: true, mimeType: true, createdAt: true,
          uploader: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      res.status(201).json({ success: true, data: attachment });
    } catch (error) { next(error); }
  });
};

const deleteAttachment = async (req, res, next) => {
  try {
    const m = await assertProjectMember(req.params.projectId, req.user.id);
    const att = await prisma.taskAttachment.findFirst({ where: { id: req.params.attachmentId, taskId: req.params.taskId } });
    if (!att) return res.status(404).json({ success: false, message: 'Attachment not found' });

    const canDelete = att.uploaderId === req.user.id || m.role === 'OWNER' || m.role === 'ADMIN';
    if (!canDelete) return res.status(403).json({ success: false, message: 'Insufficient permissions' });

    // Extract public_id from Cloudinary URL and delete from cloud storage
    if (att.url && att.url.includes('cloudinary.com')) {
      const match = att.url.match(/\/shopmvp\/attachments\/([^.]+)/);
      if (match) {
        cloudinary.uploader.destroy(`shopmvp/attachments/${match[1]}`, { resource_type: 'auto' }).catch(() => {});
      }
    }

    await prisma.taskAttachment.delete({ where: { id: req.params.attachmentId } });
    res.json({ success: true, message: 'Attachment deleted' });
  } catch (error) { next(error); }
};

// ─── Labels ────────────────────────────────────────────────────────────────

const listLabels = async (req, res, next) => {
  try {
    await assertProjectMember(req.params.projectId, req.user.id);
    const labels = await prisma.taskLabel.findMany({ where: { projectId: req.params.projectId }, orderBy: { name: 'asc' } });
    res.json({ success: true, data: labels });
  } catch (error) { next(error); }
};

const createLabel = async (req, res, next) => {
  try {
    const m = await assertProjectMember(req.params.projectId, req.user.id);
    if (m.role === 'VIEWER') return res.status(403).json({ success: false, message: 'Viewers cannot create labels' });
    const { name, color = '#6366f1' } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Label name is required' });

    const label = await prisma.taskLabel.create({ data: { projectId: req.params.projectId, name: name.trim(), color } });
    res.status(201).json({ success: true, data: label });
  } catch (error) { next(error); }
};

const deleteLabel = async (req, res, next) => {
  try {
    const m = await assertProjectMember(req.params.projectId, req.user.id);
    if (m.role !== 'OWNER' && m.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    await prisma.taskLabel.delete({ where: { id: req.params.labelId } });
    res.json({ success: true, message: 'Label deleted' });
  } catch (error) { next(error); }
};

module.exports = {
  listTasks, createTask, getTask, updateTask, deleteTask, reorderTasks,
  addComment, updateComment, deleteComment,
  addAttachment, deleteAttachment,
  listLabels, createLabel, deleteLabel,
};
