const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../utils/activityLog');
const prisma = new PrismaClient();

const getAll = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        _count: { select: { assignedTasks: true, createdTasks: true, ownedProjects: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['MEMBER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    res.json(updated);
    await logActivity(req.user.id, 'UPDATE_ROLE', 'User', user.id, `Changed ${user.name}'s role to ${role}`);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    if (user.role === 'SUPER_ADMIN') {
      return res.status(400).json({ error: 'Cannot delete another super admin' });
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
    await logActivity(req.user.id, 'DELETE_USER', 'User', user.id, `Deleted user ${user.name} (${user.email})`);
  } catch (error) {
    next(error);
  }
};

const search = async (req, res, next) => {
  try {
    const { q } = req.query;
    const where = q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } }
      ]
    } : {};
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
      take: 50
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, updateRole, remove, search };
