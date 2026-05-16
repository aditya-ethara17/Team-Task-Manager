const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLog');
const prisma = new PrismaClient();

const getByTask = async (req, res, next) => {
  try {
    const subtasks = await prisma.subTask.findMany({
      where: { taskId: req.params.taskId },
      orderBy: { createdAt: 'asc' }
    });
    res.json(subtasks);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Subtask title is required' });
    }

    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
      include: { project: { include: { members: true } } }
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = task.project.members.find(m => m.userId === req.user.id);
      if (!membership) return res.status(403).json({ error: 'Not a project member' });
    }

    const subtask = await prisma.subTask.create({
      data: { title: title.trim(), taskId: req.params.taskId }
    });

    await logActivity(req.user.id, 'CREATE', 'SubTask', subtask.id, `Added subtask "${subtask.title}" to task`);
    res.status(201).json(subtask);
  } catch (error) {
    next(error);
  }
};

const toggle = async (req, res, next) => {
  try {
    const subtask = await prisma.subTask.findUnique({ where: { id: req.params.id } });
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    const updated = await prisma.subTask.update({
      where: { id: req.params.id },
      data: { completed: !subtask.completed }
    });

    await logActivity(req.user.id, 'UPDATE', 'SubTask', subtask.id,
      `${updated.completed ? 'Completed' : 'Reopened'} subtask "${updated.title}"`);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const subtask = await prisma.subTask.findUnique({ where: { id: req.params.id } });
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });
    await prisma.subTask.delete({ where: { id: req.params.id } });
    await logActivity(req.user.id, 'DELETE', 'SubTask', req.params.id, `Deleted subtask "${subtask.title}"`);
    res.json({ message: 'Subtask deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getByTask, create, toggle, remove };
