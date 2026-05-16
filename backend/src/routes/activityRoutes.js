const { Router } = require('express');
const authenticate = require('../middleware/auth');
const { isSuperAdmin } = require('../middleware/roleCheck');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const router = Router();

router.use(authenticate);

router.get('/', isSuperAdmin, async (req, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } }
      }
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

router.get('/entity/:entity/:entityId', async (req, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { entity: req.params.entity, entityId: req.params.entityId },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } }
      }
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
