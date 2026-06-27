const prisma = require('../config/prisma');

const MEMBER_SELECT = {
  id: true, role: true, joinedAt: true,
  user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
};

const PROJECT_SELECT = {
  id: true, name: true, description: true, color: true, status: true, createdAt: true, updatedAt: true,
  owner: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
  members: { select: MEMBER_SELECT },
  _count: { select: { tasks: true } },
};

const isProjectMember = async (projectId, userId) => {
  const m = await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId } } });
  return !!m;
};

const getProjectRole = async (projectId, userId) => {
  const m = await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId } } });
  return m?.role ?? null;
};

const list = async (req, res, next) => {
  try {
    const { status = 'ACTIVE' } = req.query;
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } },
        ],
        ...(status !== 'all' && { status }),
      },
      select: PROJECT_SELECT,
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ success: true, data: projects });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Project name is required' });

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#6366f1',
        ownerId: req.user.id,
        members: { create: { userId: req.user.id, role: 'OWNER' } },
      },
      select: PROJECT_SELECT,
    });

    // Seed default labels
    await prisma.taskLabel.createMany({
      data: [
        { projectId: project.id, name: 'bug', color: '#ef4444' },
        { projectId: project.id, name: 'feature', color: '#6366f1' },
        { projectId: project.id, name: 'improvement', color: '#10b981' },
        { projectId: project.id, name: 'documentation', color: '#f59e0b' },
      ],
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      select: { ...PROJECT_SELECT, labels: true },
    });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isMember = project.ownerId === req.user.id || project.members.some((m) => m.user.id === req.user.id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });

    res.json({ success: true, data: project });
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    const role = await getProjectRole(req.params.id, req.user.id);
    if (!role || role === 'VIEWER' || role === 'MEMBER') return res.status(403).json({ success: false, message: 'Insufficient permissions' });

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(color && { color }),
      },
      select: PROJECT_SELECT,
    });
    res.json({ success: true, data: project });
  } catch (error) { next(error); }
};

const archive = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.ownerId !== req.user.id) return res.status(403).json({ success: false, message: 'Only the owner can archive this project' });

    const newStatus = project.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
    await prisma.project.update({ where: { id: req.params.id }, data: { status: newStatus } });
    res.json({ success: true, message: `Project ${newStatus === 'ACTIVE' ? 'restored' : 'archived'}`, data: { status: newStatus } });
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.ownerId !== req.user.id) return res.status(403).json({ success: false, message: 'Only the owner can delete this project' });

    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) { next(error); }
};

// Member management
const listMembers = async (req, res, next) => {
  try {
    const isMember = await isProjectMember(req.params.id, req.user.id);
    const project = await prisma.project.findUnique({ where: { id: req.params.id }, select: { ownerId: true } });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!isMember && project.ownerId !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied' });

    const members = await prisma.projectMember.findMany({
      where: { projectId: req.params.id },
      select: MEMBER_SELECT,
      orderBy: { joinedAt: 'asc' },
    });
    res.json({ success: true, data: members });
  } catch (error) { next(error); }
};

const inviteMember = async (req, res, next) => {
  try {
    const { email, role = 'MEMBER' } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const inviterRole = await getProjectRole(req.params.id, req.user.id);
    if (!inviterRole || inviterRole === 'VIEWER' || inviterRole === 'MEMBER') {
      return res.status(403).json({ success: false, message: 'Insufficient permissions to invite members' });
    }

    const invitee = await prisma.user.findUnique({ where: { email }, select: { id: true, firstName: true, lastName: true, email: true } });
    if (!invitee) return res.status(404).json({ success: false, message: 'No user found with that email' });

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.params.id, userId: invitee.id } },
    });
    if (existing) return res.status(409).json({ success: false, message: 'User is already a member' });

    const member = await prisma.projectMember.create({
      data: { projectId: req.params.id, userId: invitee.id, role },
      select: MEMBER_SELECT,
    });

    // Notify the invitee
    await prisma.notification.create({
      data: {
        userId: invitee.id,
        type: 'system',
        title: 'Project invitation',
        body: `You were added to a project as ${role.toLowerCase()}.`,
        link: `/projects/${req.params.id}`,
      },
    });

    res.status(201).json({ success: true, data: member });
  } catch (error) { next(error); }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const inviterRole = await getProjectRole(req.params.id, req.user.id);
    if (!inviterRole || inviterRole !== 'OWNER') return res.status(403).json({ success: false, message: 'Only the owner can change roles' });

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } },
    });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    if (member.role === 'OWNER') return res.status(400).json({ success: false, message: 'Cannot change the owner role' });

    const updated = await prisma.projectMember.update({
      where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } },
      data: { role },
      select: MEMBER_SELECT,
    });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
};

const removeMember = async (req, res, next) => {
  try {
    const requesterRole = await getProjectRole(req.params.id, req.user.id);
    const isSelf = req.params.userId === req.user.id;

    if (!isSelf && (!requesterRole || requesterRole === 'VIEWER' || requesterRole === 'MEMBER')) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } },
    });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    if (member.role === 'OWNER') return res.status(400).json({ success: false, message: 'Cannot remove the project owner' });

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } },
    });
    res.json({ success: true, message: 'Member removed' });
  } catch (error) { next(error); }
};

module.exports = { list, create, getById, update, archive, remove, listMembers, inviteMember, updateMemberRole, removeMember };
