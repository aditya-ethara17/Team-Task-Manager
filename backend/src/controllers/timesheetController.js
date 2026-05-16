const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getMyTimesheet = async (req, res, next) => {
  try {
    const { week } = req.query;
    const now = new Date();
    const startOfWeek = week ? new Date(week) : new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      select: { projectId: true }
    });
    const projectIds = memberships.map(m => m.projectId);

    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: req.user.id,
        createdAt: { gte: startOfWeek, lte: endOfWeek },
        task: { projectId: { in: projectIds } }
      },
      include: {
        task: {
          select: { id: true, title: true, project: { select: { id: true, name: true } } }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const daily = days.map((name, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayEntries = entries.filter(e => {
        const eDate = new Date(e.createdAt).toISOString().split('T')[0];
        return eDate === dateStr;
      });
      const total = dayEntries.reduce((s, e) => s + e.hours, 0);
      return { dayName: name, date: dateStr, entries: dayEntries, total: Math.round(total * 100) / 100 };
    });

    const weeklyTotal = entries.reduce((s, e) => s + e.hours, 0);

    res.json({
      weekStart: startOfWeek.toISOString().split('T')[0],
      weekEnd: endOfWeek.toISOString().split('T')[0],
      daily,
      weeklyTotal: Math.round(weeklyTotal * 100) / 100,
      totalEntries: entries.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyTimesheet };
