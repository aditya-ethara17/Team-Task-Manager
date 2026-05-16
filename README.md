# Taskify - Team Task Manager

A full-stack team task management application with role-based access control. Users can create projects, manage teams, assign tasks, and track progress.

## Features

- **Authentication** – Signup/Login with JWT
- **Project Management** – Create, update, delete projects
- **Team Management** – Add/remove members with Admin/Member roles
- **Task Management** – Create, update, delete, reassign tasks with status & priority
- **Dashboard** – Overview of tasks, status breakdown, overdue tracking
- **Role-Based Access** – Admins control projects; Members manage assigned tasks

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| Deployment | Railway |

## Project Structure

```
team-task-manager/
├── backend/
│   ├── prisma/          # Schema & migrations
│   ├── src/
│   │   ├── controllers/ # Route handlers
│   │   ├── middleware/   # Auth & role checks
│   │   ├── routes/       # API routes
│   │   └── utils/        # Error handler
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios client
│   │   ├── components/   # Shared components
│   │   ├── context/      # Auth context
│   │   └── pages/        # Page components
│   └── package.json
├── railway.json          # Railway deployment config
└── package.json          # Root scripts
```

## API Endpoints

### Auth
- `POST /api/auth/signup` – Register
- `POST /api/auth/login` – Login

### Projects
- `GET /api/projects` – List my projects
- `POST /api/projects` – Create project
- `GET /api/projects/:id` – Project details
- `PUT /api/projects/:id` – Update project
- `DELETE /api/projects/:id` – Delete project
- `POST /api/projects/:id/members` – Add member
- `DELETE /api/projects/:id/members/:memberId` – Remove member

### Tasks
- `POST /api/tasks/project/:projectId` – Create task
- `PUT /api/tasks/:id` – Update task
- `DELETE /api/tasks/:id` – Delete task

### Dashboard
- `GET /api/dashboard` – Aggregated stats

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL

### Local Development

```bash
# Install dependencies
npm run setup

# Set up environment
cp backend/.env.example backend/.env
# Edit backend/.env with your DATABASE_URL and JWT_SECRET

# Run database migrations
npm run db:migrate

# Start dev servers (backend + frontend concurrently)
npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment Variables

**backend/.env**
```
DATABASE_URL=postgresql://user:password@host:5432/team_task_manager
JWT_SECRET=your-secret-key
PORT=5000
```

## Deployment (Railway)

1. Push repository to GitHub
2. Connect repo on [Railway](https://railway.app)
3. Add a PostgreSQL plugin – Railway provides `DATABASE_URL` automatically
4. Add `JWT_SECRET` environment variable in Railway dashboard
5. The `railway.json` handles build & start commands
6. Deploy – Railway runs migrations via `prisma migrate deploy`

## Role-Based Access

| Action | Project Admin | Project Member |
|---|---|---|
| Edit/delete project | ✓ | ✗ |
| Add/remove members | ✓ | ✗ |
| Create tasks | ✓ | ✓ |
| Update any task | ✓ | ✗ |
| Update own assigned task | ✓ | ✓ |
| Delete tasks | ✓ | ✗ |

## License

MIT
