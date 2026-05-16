const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLog');
const prisma = new PrismaClient();

const getByTask = async (req, res, next) => {
  try {
    const entries = await prisma.timeEntry.findMany({
      where: { taskId: req.params.taskId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    res.json({ entries, totalHours });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { hours, description } = req.body;
    if (!hours || hours <= 0) {
      return res.status(400).json({ error: 'Hours must be greater than 0' });
    }

    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
      include: { project: { include: { members: true } } }
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const isMember = task.project.members.some(m => m.userId === req.user.id);
      if (!isMember) return res.status(403).json({ error: 'Not a project member' });
    }

    const entry = await prisma.timeEntry.create({
      data: {
        hours: parseFloat(hours),
        description: description || null,
        taskId: req.params.taskId,
        userId: req.user.id
      },
      include: { user: { select: { id: true, name: true } } }
    });

    await logActivity(req.user.id, 'LOG_TIME', 'Task', task.id, `${req.user.name} logged ${hours}h on "${task.title}"`);
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const entry = await prisma.timeEntry.findUnique({ where: { id: req.params.id } });
    if (!entry) return res.status(404).json({ error: 'Time entry not found' });
    if (entry.userId !== req.user.id && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Can only delete your own time entries' });
    }
    await prisma.timeEntry.delete({ where: { id: req.params.id } });
    res.json({ message: 'Time entry deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getByTask, create, remove };
