const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLog');
const prisma = new PrismaClient();

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        description,
        createdBy: req.user.id,
        members: { create: { userId: req.user.id, role: 'ADMIN' } }
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        _count: { select: { tasks: true } }
      }
    });

    res.status(201).json(project);
    await logActivity(req.user.id, 'CREATE', 'Project', project.id, `Created project "${project.name}"`);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const where = req.user.role === 'SUPER_ADMIN' ? {} : { members: { some: { userId: req.user.id } } };
    const projects = await prisma.project.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { tasks: true, members: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(projects);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { id: true, name: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        tasks: {
          include: {
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
          },
          orderBy: { createdAt: 'desc' }
        },
        labels: { orderBy: { name: 'asc' } },
        phases: { orderBy: { startDate: 'asc' } },
        issues: {
          include: {
            assignee: { select: { id: true, name: true } },
            reporter: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isMember = req.user.role === 'SUPER_ADMIN' || project.members.some(m => m.userId === req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Not a project member' });
    }

    res.json(project);
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

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: req.params.id, userId: req.user.id }
        }
      });
      if (!membership || membership.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { name: req.body.name, description: req.body.description },
      include: { _count: { select: { tasks: true, members: true } } }
    });

    res.json(project);
    await logActivity(req.user.id, 'UPDATE', 'Project', project.id, `Updated project "${project.name}"`);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (req.user.role !== 'SUPER_ADMIN' && project.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Only project creator or super admin can delete' });
    }

    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted' });
    await logActivity(req.user.id, 'DELETE', 'Project', req.params.id, `Deleted project "${project.name}"`);
  } catch (error) {
    next(error);
  }
};

const addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) return res.status(404).json({ error: 'User not found' });

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: req.params.id, userId: userToAdd.id }
      }
    });

    if (existingMember) {
      return res.status(409).json({ error: 'User is already a member' });
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId: req.params.id,
        userId: userToAdd.id,
        role: role || 'MEMBER'
      },
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    res.status(201).json(member);
    await logActivity(req.user.id, 'ADD_MEMBER', 'Project', req.params.id, `Added ${userToAdd.name} as ${role || 'MEMBER'}`);
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const membership = await prisma.projectMember.findUnique({ where: { id: memberId } });
    if (!membership) return res.status(404).json({ error: 'Member not found' });

    const project = await prisma.project.findUnique({ where: { id: membership.projectId } });
    if (req.user.role !== 'SUPER_ADMIN' && project.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Only project creator or super admin can remove members' });
    }

    await prisma.projectMember.delete({ where: { id: memberId } });
    res.json({ message: 'Member removed' });
    await logActivity(req.user.id, 'REMOVE_MEMBER', 'Project', membership.projectId, `Removed member from project`);
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById, update, remove, addMember, removeMember };
