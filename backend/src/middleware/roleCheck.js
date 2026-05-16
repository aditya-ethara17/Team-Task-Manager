const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

const isProjectAdmin = async (req, res, next) => {
  try {
    if (req.user.role === 'SUPER_ADMIN') return next();

    const projectId = req.params.id || req.body.projectId;
    if (!projectId) return res.status(400).json({ error: 'Project ID required' });

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: req.user.id }
      }
    });

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const isProjectMember = async (req, res, next) => {
  try {
    if (req.user.role === 'SUPER_ADMIN') return next();

    const projectId = req.params.id || req.body.projectId;
    if (!projectId) return res.status(400).json({ error: 'Project ID required' });

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: req.user.id }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a project member' });
    }

    req.membership = membership;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { isSuperAdmin, isProjectAdmin, isProjectMember };
