const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLog');
const prisma = new PrismaClient();

const send = async (req, res, next) => {
  try {
    const { content, projectId, taskId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    let resolvedProjectId = projectId || null;
    let resolvedTaskId = taskId || null;

    if (taskId) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) return res.status(404).json({ error: 'Task not found' });
      resolvedProjectId = task.projectId;
      if (req.user.role !== 'SUPER_ADMIN') {
        const membership = await prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } }
        });
        if (!membership) return res.status(403).json({ error: 'Not a project member' });
      }
    } else if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return res.status(404).json({ error: 'Project not found' });
      if (req.user.role !== 'SUPER_ADMIN') {
        const membership = await prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId: req.user.id } }
        });
        if (!membership) return res.status(403).json({ error: 'Not a project member' });
      }
    }

    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        projectId: resolvedProjectId,
        taskId: resolvedTaskId,
        userId: req.user.id
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

const getByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: req.user.id } }
      });
      if (!membership) return res.status(403).json({ error: 'Not a project member' });
    }
    const since = req.query.since ? new Date(req.query.since) : new Date(0);
    const messages = await prisma.chatMessage.findMany({
      where: { projectId, taskId: null, conversationId: null, createdAt: { gt: since } },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100
    });
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

const getByTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } }
      });
      if (!membership) return res.status(403).json({ error: 'Not a project member' });
    }
    const since = req.query.since ? new Date(req.query.since) : new Date(0);
    const messages = await prisma.chatMessage.findMany({
      where: { taskId, conversationId: null, createdAt: { gt: since } },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100
    });
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

const getGlobal = async (req, res, next) => {
  try {
    const since = req.query.since ? new Date(req.query.since) : new Date(0);
    const messages = await prisma.chatMessage.findMany({
      where: { projectId: null, taskId: null, conversationId: null, createdAt: { gt: since } },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'asc' },
      take: 200
    });
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

module.exports = { send, getByProject, getByTask, getGlobal };
