const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLog');
const prisma = new PrismaClient();

const taskIncludes = {
  assignee: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  files: {
    include: { uploadedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' }
  },
  comments: {
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' }
  },
  subtasks: { orderBy: { createdAt: 'asc' } },
  labels: {
    include: { label: true }
  },
  timeEntries: {
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' }
  },
  watchers: {
    include: { user: { select: { id: true, name: true } } }
  }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    const { projectId } = req.params;

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: req.user.id } }
      });
      if (!membership) return res.status(403).json({ error: 'Not a project member' });
      if (membership.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only admin or super admin can create tasks' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        createdById: req.user.id
      },
      include: taskIncludes
    });

    if (assigneeId && assigneeId !== req.user.id) {
      await prisma.notification.create({
        data: {
          type: 'TASK_ASSIGNED',
          message: `You were assigned to "${title}"`,
          userId: assigneeId,
          taskId: task.id
        }
      });
    }

    res.status(201).json(task);
    await logActivity(req.user.id, 'CREATE', 'Task', task.id, `Created task "${task.title}"`);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    let isAdmin = req.user.role === 'SUPER_ADMIN';
    let isAssignee = task.assigneeId === req.user.id;

    if (!isAdmin) {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } }
      });
      if (!membership) return res.status(403).json({ error: 'Not a project member' });
      if (membership.role === 'ADMIN') isAdmin = true;
    }

    const { title, description: desc, status: st, priority, dueDate, assigneeId } = req.body;

    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ error: 'Only admin or assignee can update this task' });
    }

    if (!isAdmin && isAssignee) {
      if (title !== undefined || priority !== undefined || dueDate !== undefined || assigneeId !== undefined) {
        return res.status(403).json({ error: 'Taskers can only update status and description' });
      }
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(desc !== undefined && { description: desc }),
        ...(st !== undefined && { status: st }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId })
      },
      include: taskIncludes
    });

    if (assigneeId && assigneeId !== task.assigneeId && assigneeId !== req.user.id) {
      await prisma.notification.create({
        data: {
          type: 'TASK_ASSIGNED',
          message: `You were assigned to "${updated.title}"`,
          userId: assigneeId,
          taskId: updated.id
        }
      });
    }

    res.json(updated);
    const changes = [];
    if (st && st !== task.status) changes.push(`status → ${st}`);
    if (title && title !== task.title) changes.push('title changed');
    if (assigneeId && assigneeId !== task.assigneeId) changes.push('assignee changed');
    await logActivity(req.user.id, 'UPDATE', 'Task', task.id, `Updated task "${updated.title}"${changes.length ? ': ' + changes.join(', ') : ''}`);

    if (st && st !== task.status) {
      const watchers = await prisma.taskWatcher.findMany({
        where: { taskId: task.id, userId: { not: req.user.id } },
        select: { userId: true }
      });
      for (const w of watchers) {
        await prisma.notification.create({
          data: {
            type: 'TASK_UPDATED',
            message: `Task "${updated.title}" moved to ${st.replace('_', ' ')}`,
            userId: w.userId,
            taskId: task.id
          }
        });
      }
    }
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } }
      });
      if (!membership || membership.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted' });
    await logActivity(req.user.id, 'DELETE', 'Task', req.params.id, `Deleted task "${task.title}"`);
  } catch (error) {
    next(error);
  }
};

const search = async (req, res, next) => {
  try {
    const { projectId, q, status, priority, assigneeId, labelId } = req.query;

    const where = { projectId };

    if (q) where.title = { contains: q, mode: 'insensitive' };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (labelId) {
      where.labels = { some: { labelId } };
    }

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: req.user.id } }
      });
      if (!membership) return res.status(403).json({ error: 'Not a project member' });
    }

    const tasks = await prisma.task.findMany({
      where,
      include: taskIncludes,
      orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

const kanban = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: req.user.id } }
      });
      if (!membership) return res.status(403).json({ error: 'Not a project member' });
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: taskIncludes,
      orderBy: { createdAt: 'desc' }
    });

    const columns = { TODO: [], IN_PROGRESS: [], REVIEW: [], DONE: [] };
    tasks.forEach(task => {
      if (columns[task.status]) columns[task.status].push(task);
      else columns.TODO.push(task);
    });

    res.json(columns);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: taskIncludes
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } }
      });
      if (!membership) return res.status(403).json({ error: 'Not a project member' });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

const watch = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { project: { include: { members: true } } }
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const isMember = task.project.members.some(m => m.userId === req.user.id);
      if (!isMember) return res.status(403).json({ error: 'Not a project member' });
    }

    const existing = await prisma.taskWatcher.findUnique({
      where: { taskId_userId: { taskId: req.params.id, userId: req.user.id } }
    });

    if (existing) {
      await prisma.taskWatcher.delete({ where: { id: existing.id } });
      res.json({ watching: false });
    } else {
      await prisma.taskWatcher.create({
        data: { taskId: req.params.id, userId: req.user.id }
      });
      res.json({ watching: true });
    }
  } catch (error) {
    next(error);
  }
};

const watchStatus = async (req, res, next) => {
  try {
    const existing = await prisma.taskWatcher.findUnique({
      where: { taskId_userId: { taskId: req.params.id, userId: req.user.id } }
    });
    res.json({ watching: !!existing });
  } catch (error) {
    next(error);
  }
};

const myTasks = async (req, res, next) => {
  try {
    const { status } = req.query;

    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      select: { projectId: true }
    });
    const projectIds = memberships.map(m => m.projectId);

    const where = {
      assigneeId: req.user.id,
      projectId: { in: projectIds }
    };
    if (status) where.status = status;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        ...taskIncludes,
        project: { select: { id: true, name: true } }
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }]
    });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

const myKanban = async (req, res, next) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      select: { projectId: true }
    });
    const projectIds = memberships.map(m => m.projectId);

    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: req.user.id,
        projectId: { in: projectIds }
      },
      include: {
        ...taskIncludes,
        project: { select: { id: true, name: true } }
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }]
    });

    const columns = { TODO: [], IN_PROGRESS: [], REVIEW: [], DONE: [] };
    tasks.forEach(task => {
      if (columns[task.status]) columns[task.status].push(task);
      else columns.TODO.push(task);
    });

    res.json(columns);
  } catch (error) {
    next(error);
  }
};

module.exports = { create, update, remove, search, kanban, getById, watch, watchStatus, myTasks, myKanban };
