const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLog');

const prisma = new PrismaClient();

const create = async (req, res, next) => {
  try {
    const { url, title, description, projectId, taskId } = req.body;

    if (!url || !title) {
      return res.status(400).json({ error: 'URL and title are required' });
    }

    if (!projectId && !taskId) {
      return res.status(400).json({ error: 'Must provide projectId or taskId' });
    }

    let validProjectId = projectId;

    if (taskId) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) return res.status(404).json({ error: 'Task not found' });
      validProjectId = task.projectId;

      if (req.user.role !== 'SUPER_ADMIN') {
        const membership = await prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } }
        });
        if (!membership) return res.status(403).json({ error: 'Not a project member' });
      }
    }

    if (!taskId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return res.status(404).json({ error: 'Project not found' });

      if (req.user.role !== 'SUPER_ADMIN') {
        const membership = await prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId: req.user.id } }
        });
        if (!membership) return res.status(403).json({ error: 'Not a project member' });
      }
    }

    const isAdminForProject = req.user.role === 'SUPER_ADMIN' || await prisma.projectMember.findFirst({
      where: { projectId: validProjectId, userId: req.user.id, role: 'ADMIN' }
    });
    if (!isAdminForProject) {
      return res.status(403).json({ error: 'Only admin or super admin can add links' });
    }

    const link = await prisma.resourceLink.create({
      data: {
        url,
        title,
        description,
        projectId: projectId || null,
        taskId: taskId || null,
        createdById: req.user.id
      },
      include: {
        createdBy: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(link);
    const entity = taskId ? 'Task' : 'Project';
    await logActivity(req.user.id, 'ADD_LINK', entity, taskId || projectId, `Added link "${title}"`);
  } catch (error) {
    next(error);
  }
};

const getByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const links = await prisma.resourceLink.findMany({
      where: { projectId },
      include: {
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(links);
  } catch (error) {
    next(error);
  }
};

const getByTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const links = await prisma.resourceLink.findMany({
      where: { taskId },
      include: {
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(links);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { linkId } = req.params;
    const link = await prisma.resourceLink.findUnique({
      where: { id: linkId },
      include: {
        project: {
          include: {
            members: { where: { userId: req.user.id } }
          }
        }
      }
    });

    if (!link) return res.status(404).json({ error: 'Link not found' });

    const isAdmin = req.user.role === 'SUPER_ADMIN' ||
      (link.project && link.project.members.length > 0 && link.project.members[0].role === 'ADMIN');

    if (!isAdmin && link.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this link' });
    }

    await prisma.resourceLink.delete({ where: { id: linkId } });
    res.json({ message: 'Link deleted' });
    await logActivity(req.user.id, 'DELETE_LINK', link.taskId ? 'Task' : 'Project', link.taskId || link.projectId, `Deleted link "${link.title}"`);
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getByProject, getByTask, remove };
