const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLog');
const prisma = new PrismaClient();

const getByProject = async (req, res, next) => {
  try {
    const labels = await prisma.label.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { name: 'asc' }
    });
    res.json(labels);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Label name is required' });
    }

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: req.params.projectId, userId: req.user.id } }
      });
      if (!membership) return res.status(403).json({ error: 'Not a project member' });
      if (membership.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    const existing = await prisma.label.findUnique({
      where: { name_projectId: { name: name.trim(), projectId: req.params.projectId } }
    });
    if (existing) return res.status(409).json({ error: 'Label already exists' });

    const label = await prisma.label.create({
      data: { name: name.trim(), color: color || '#6366f1', projectId: req.params.projectId }
    });

    await logActivity(req.user.id, 'CREATE', 'Label', label.id, `Created label "${label.name}"`);
    res.status(201).json(label);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const label = await prisma.label.findUnique({ where: { id: req.params.id } });
    if (!label) return res.status(404).json({ error: 'Label not found' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: label.projectId, userId: req.user.id } }
      });
      if (!membership || membership.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    await prisma.label.delete({ where: { id: req.params.id } });
    await logActivity(req.user.id, 'DELETE', 'Label', req.params.id, `Deleted label "${label.name}"`);
    res.json({ message: 'Label deleted' });
  } catch (error) {
    next(error);
  }
};

const addToTask = async (req, res, next) => {
  try {
    const { labelId } = req.body;
    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
      include: { project: { include: { members: true } } }
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const isMember = task.project.members.some(m => m.userId === req.user.id);
      if (!isMember) return res.status(403).json({ error: 'Not a project member' });
    }

    const label = await prisma.label.findUnique({ where: { id: labelId } });
    if (!label || label.projectId !== task.projectId) {
      return res.status(400).json({ error: 'Invalid label for this project' });
    }

    const existing = await prisma.taskLabel.findUnique({
      where: { taskId_labelId: { taskId: req.params.taskId, labelId } }
    });
    if (existing) return res.status(409).json({ error: 'Label already on task' });

    await prisma.taskLabel.create({
      data: { taskId: req.params.taskId, labelId }
    });

    await logActivity(req.user.id, 'UPDATE', 'Task', task.id, `Added label "${label.name}" to task "${task.title}"`);
    res.status(201).json({ message: 'Label added' });
  } catch (error) {
    next(error);
  }
};

const removeFromTask = async (req, res, next) => {
  try {
    const taskLabel = await prisma.taskLabel.findUnique({
      where: { taskId_labelId: { taskId: req.params.taskId, labelId: req.params.labelId } }
    });
    if (!taskLabel) return res.status(404).json({ error: 'Label not on task' });

    await prisma.taskLabel.delete({
      where: { taskId_labelId: { taskId: req.params.taskId, labelId: req.params.labelId } }
    });

    res.json({ message: 'Label removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getByProject, create, remove, addToTask, removeFromTask };
