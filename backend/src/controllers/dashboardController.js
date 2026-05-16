const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getStats = async (req, res, next) => {
  try {
    let tasks;

    if (req.user.role === 'SUPER_ADMIN') {
      tasks = await prisma.task.findMany({
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } }
        }
      });
    } else {
      const memberships = await prisma.projectMember.findMany({
        where: { userId: req.user.id },
        select: { projectId: true }
      });

      const ids = memberships.map(m => m.projectId);

      tasks = await prisma.task.findMany({
        where: { projectId: { in: ids } },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } }
        }
      });
    }

    const projectIds = [...new Set(tasks.map(t => t.projectId))];
    const totalTasks = tasks.length;
    const tasksByStatus = {
      TODO: tasks.filter(t => t.status === 'TODO').length,
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      REVIEW: tasks.filter(t => t.status === 'REVIEW').length,
      DONE: tasks.filter(t => t.status === 'DONE').length
    };

    const now = new Date();
    const overdueTasks = tasks.filter(
      t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    );

    const myTasks = tasks.filter(t => t.assigneeId === req.user.id);
    const myOverdueTasks = myTasks.filter(
      t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    );

    const response = {
      totalTasks,
      tasksByStatus,
      overdueCount: overdueTasks.length,
      myTaskCount: myTasks.length,
      myOverdueCount: myOverdueTasks.length,
      overdueTasks: overdueTasks.slice(0, 10),
      myTasks: myTasks.slice(0, 10),
      projectCount: projectIds.length
    };

    if (req.user.role === 'SUPER_ADMIN') {
      const [totalUsers, totalProjects, recentUsers, recentActivities] = await Promise.all([
        prisma.user.count(),
        prisma.project.count(),
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, email: true, createdAt: true }
        }),
        prisma.activityLog.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } }
          }
        })
      ]);

      const topPerformers = await prisma.user.findMany({
        where: {
          assignedTasks: { some: { status: 'DONE' } }
        },
        select: {
          id: true, name: true, email: true,
          _count: {
            select: {
              assignedTasks: { where: { status: 'DONE' } }
            }
          }
        },
        orderBy: { assignedTasks: { _count: 'desc' } },
        take: 5
      });

      response.totalUsers = totalUsers;
      response.totalProjects = totalProjects;
      response.recentUsers = recentUsers;
      response.recentActivities = recentActivities;
      response.topPerformers = topPerformers;
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats };
