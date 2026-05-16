const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Super Admin
  const superPassword = await bcrypt.hash('Aditya@123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'aditya_raj@superadmin.com' },
    update: {},
    create: {
      name: 'Aditya Raj',
      email: 'aditya_raj@superadmin.com',
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
      update: {},
      create: { ...u, password: userPassword, role: 'MEMBER' },
    });
    createdUsers.push(user);
  }

  // 3. Create Projects
  const projects = [
    { name: 'Website Redesign', description: 'Modernizing the company landing page' },
    { name: 'Mobile App', description: 'Building the new iOS/Android application' },
    { name: 'Internal Dashboard', description: 'Analytics for team performance' },
  ];

  for (const p of projects) {
    const project = await prisma.project.create({
      data: {
        ...p,
        createdBy: superAdmin.id,
        members: {
          create: [
            { userId: superAdmin.id, role: 'ADMIN' },
            ...createdUsers.slice(0, 2).map(u => ({ userId: u.id, role: 'MEMBER' }))
          ]
        }
      }
    });

    // 4. Create Tasks for each project
    await prisma.task.createMany({
      data: [
        {
          title: 'Design UI Mockups',
          description: 'Create Figma designs for the home page',
          status: 'DONE',
          priority: 'HIGH',
          projectId: project.id,
          createdById: superAdmin.id,
          assigneeId: createdUsers[0].id,
        },
        {
          title: 'Setup API Endpoints',
          description: 'Implement core REST API routes',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          projectId: project.id,
          createdById: superAdmin.id,
          assigneeId: createdUsers[1].id,
        },
        {
          title: 'Write Documentation',
          description: 'Draft user guide and API docs',
          status: 'TODO',
          priority: 'LOW',
          projectId: project.id,
          createdById: superAdmin.id,
        }
      ]
    });
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
