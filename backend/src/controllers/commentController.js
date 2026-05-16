const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLog');
const prisma = new PrismaClient();

const getByTask = async (req, res, next) => {
  try {
    const comments = await prisma.taskComment.findMany({
      where: { taskId: req.params.taskId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(comments);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
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

    const comment = await prisma.taskComment.create({
      data: { content: content.trim(), taskId: req.params.taskId, userId: req.user.id },
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    const taskUrl = `/projects/${task.projectId}?task=${task.id}`;
    if (task.assigneeId && task.assigneeId !== req.user.id) {
      await prisma.notification.create({
        data: {
          type: 'TASK_COMMENT',
          message: `${req.user.name} commented on "${task.title}"`,
          userId: task.assigneeId,
          taskId: task.id
        }
      });
    }
    if (task.createdById && task.createdById !== req.user.id && task.createdById !== task.assigneeId) {
      await prisma.notification.create({
        data: {
          type: 'TASK_COMMENT',
          message: `${req.user.name} commented on "${task.title}"`,
          userId: task.createdById,
          taskId: task.id
        }
      });
    }

    await logActivity(req.user.id, 'COMMENT', 'Task', task.id, `${req.user.name} commented on "${task.title}"`);
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const comment = await prisma.taskComment.findUnique({ where: { id: req.params.id } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.userId !== req.user.id && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Can only delete your own comment' });
    }
    await prisma.taskComment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getByTask, create, remove };
