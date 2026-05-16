const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const logActivity = async (userId, action, entity, entityId, details) => {
  try {
    await prisma.activityLog.create({
      data: { userId, action, entity, entityId, details }
    });
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
};

module.exports = { logActivity };
