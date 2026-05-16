const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLog');
const prisma = new PrismaClient();

const issueIncludes = {
  assignee: { select: { id: true, name: true } },
  reporter: { select: { id: true, name: true } },
  project: { select: { id: true, name: true } }
};

const create = async (req, res, next) => {
  try {
    const { title, description, priority, severity, dueDate, assigneeId } = req.body;
    const { projectId } = req.params;

    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: req.user.id } }
      });
      if (!membership) return res.status(403).json({ error: 'Not a project member' });
      if (membership.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    const issue = await prisma.issue.create({
      data: {
        title: title.trim(),
        description,
        priority: priority || 'MEDIUM',
        severity: severity || 'MAJOR',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        reporterId: req.user.id
      },
      include: issueIncludes
    });

    if (assigneeId && assigneeId !== req.user.id) {
      await prisma.notification.create({
        data: {
          type: 'ISSUE_ASSIGNED',
          message: `Issue assigned: "${issue.title}"`,
          userId: assigneeId,
        }
      });
    }

    await logActivity(req.user.id, 'CREATE', 'Issue', issue.id, `Created issue "${issue.title}"`);
    res.status(201).json(issue);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: issue.projectId, userId: req.user.id } }
      });
      if (!membership) return res.status(403).json({ error: 'Not a project member' });
      if (membership.role !== 'ADMIN' && issue.assigneeId !== req.user.id) {
        return res.status(403).json({ error: 'Only admin or assignee can update' });
      }
    }

    const { title, description, status, priority, severity, dueDate, assigneeId } = req.body;
    const updated = await prisma.issue.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(severity !== undefined && { severity }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId })
      },
      include: issueIncludes
    });

    res.json(updated);
    await logActivity(req.user.id, 'UPDATE', 'Issue', issue.id, `Updated issue "${updated.title}"`);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: issue.projectId, userId: req.user.id } }
      });
      if (!membership || membership.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
    }

    await prisma.issue.delete({ where: { id: req.params.id } });
    res.json({ message: 'Issue deleted' });
    await logActivity(req.user.id, 'DELETE', 'Issue', req.params.id, `Deleted issue "${issue.title}"`);
  } catch (error) {
    next(error);
  }
};

const getByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, priority, severity, assigneeId, q } = req.query;

    const where = { projectId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (severity) where.severity = severity;
    if (assigneeId) where.assigneeId = assigneeId;
    if (q) where.title = { contains: q, mode: 'insensitive' };

    const issues = await prisma.issue.findMany({
      where,
      include: issueIncludes,
      orderBy: { createdAt: 'desc' }
    });
    res.json(issues);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const issue = await prisma.issue.findUnique({
      where: { id: req.params.id },
      include: issueIncludes
    });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    res.json(issue);
  } catch (error) {
    next(error);
  }
};

const kanban = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const issues = await prisma.issue.findMany({
      where: { projectId },
      include: issueIncludes,
      orderBy: { createdAt: 'desc' }
    });
    const columns = { OPEN: [], IN_PROGRESS: [], RESOLVED: [], REOPENED: [], CLOSED: [] };
    issues.forEach(issue => {
      if (columns[issue.status]) columns[issue.status].push(issue);
      else columns.OPEN.push(issue);
    });
    res.json(columns);
  } catch (error) {
    next(error);
  }
};

module.exports = { create, update, remove, getByProject, getById, kanban };
