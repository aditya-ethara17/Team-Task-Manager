require('../src/config/env');

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function ensureProjectMember(projectId, userId, role) {
  return prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
    update: { role },
    create: {
      projectId,
      userId,
      role,
    },
  });
}

async function ensureTask(projectId, taskData) {
  const existingTask = await prisma.task.findFirst({
    where: {
      projectId,
      title: taskData.title,
    },
  });

  if (existingTask) {
    return prisma.task.update({
      where: { id: existingTask.id },
      data: {
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        assigneeId: taskData.assigneeId,
      },
    });
  }

  return prisma.task.create({
    data: {
      ...taskData,
      projectId,
    },
  });
}

async function main() {
  console.log('Seeding database...');

  // 1. Create Super Admin
  const superAdminName = process.env.SUPER_ADMIN_NAME || 'Aditya Raj';
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'aditya_raj@superadmin.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Aditya@123';
  const superPassword = await bcrypt.hash(superAdminPassword, 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      name: superAdminName,
      role: 'SUPER_ADMIN',
    },
    create: {
      name: superAdminName,
      email: superAdminEmail,
      password: superPassword,
      role: 'SUPER_ADMIN',
    },
  });

  // 2. Create Dummy Users
  const userPassword = await bcrypt.hash('User@123', 12);
  const users = [
    { name: 'John Doe', email: 'john@example.com' },
    { name: 'Jane Smith', email: 'jane@example.com' },
    { name: 'Alice Brown', email: 'alice@example.com' },
    { name: 'Bob Wilson', email: 'bob@example.com' },
  ];

  const createdUsers = [];
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
      },
      create: { ...u, password: userPassword, role: 'MEMBER' },
    });
    createdUsers.push(user);
  }

  // 3. Create Projects (idempotent)
  const projects = [
    { name: 'Website Redesign', description: 'Modernizing the company landing page' },
    { name: 'Mobile App', description: 'Building the new iOS/Android application' },
    { name: 'Internal Dashboard', description: 'Analytics for team performance' },
  ];

  for (const p of projects) {
    let project = await prisma.project.findFirst({
      where: { name: p.name }
    });

    if (project) {
      project = await prisma.project.update({
        where: { id: project.id },
        data: {
          description: p.description,
          createdBy: superAdmin.id,
        },
      });
    } else {
      project = await prisma.project.create({
        data: {
          ...p,
          createdBy: superAdmin.id,
        }
      });
    }

    await ensureProjectMember(project.id, superAdmin.id, 'ADMIN');
    for (const user of createdUsers.slice(0, 2)) {
      await ensureProjectMember(project.id, user.id, 'MEMBER');
    }

    const tasks = [
      {
        title: 'Design UI Mockups',
        description: 'Create Figma designs for the home page',
        status: 'DONE',
        priority: 'HIGH',
        createdById: superAdmin.id,
        assigneeId: createdUsers[0].id,
      },
      {
        title: 'Setup API Endpoints',
        description: 'Implement core REST API routes',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        createdById: superAdmin.id,
        assigneeId: createdUsers[1].id,
      },
      {
        title: 'Write Documentation',
        description: 'Draft user guide and API docs',
        status: 'TODO',
        priority: 'LOW',
        createdById: superAdmin.id,
      }
    ];

    for (const task of tasks) {
      await ensureTask(project.id, task);
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
