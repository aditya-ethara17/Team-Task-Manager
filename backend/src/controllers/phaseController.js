const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLog');
const prisma = new PrismaClient();

const getByProject = async (req, res, next) => {
  try {
    const phases = await prisma.phase.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { startDate: 'asc' }
    });
    res.json(phases);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, description, startDate, endDate } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Phase name is required' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: req.params.projectId, userId: req.user.id } }
      });
      if (!membership || membership.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    const phase = await prisma.phase.create({
      data: {
        name: name.trim(),
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        projectId: req.params.projectId
      }
    });
    await logActivity(req.user.id, 'CREATE', 'Phase', phase.id, `Created phase "${phase.name}"`);
    res.status(201).json(phase);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, description, startDate, endDate, status } = req.body;

    if (req.user.role !== 'SUPER_ADMIN') {
      const phase = await prisma.phase.findUnique({ where: { id: req.params.id } });
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: phase.projectId, userId: req.user.id } }
      });
      if (!membership || membership.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
    }

    const updated = await prisma.phase.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(status !== undefined && { status })
      }
    });
    res.json(updated);
    await logActivity(req.user.id, 'UPDATE', 'Phase', updated.id, `Updated phase "${updated.name}"`);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const phase = await prisma.phase.findUnique({ where: { id: req.params.id } });
    if (!phase) return res.status(404).json({ error: 'Phase not found' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: phase.projectId, userId: req.user.id } }
      });
      if (!membership || membership.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
    }

    await prisma.phase.delete({ where: { id: req.params.id } });
    res.json({ message: 'Phase deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getByProject, create, update, remove };
