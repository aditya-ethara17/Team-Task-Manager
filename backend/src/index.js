require('./config/env');

const express = require('express');
const path = require('path');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const fileRoutes = require('./routes/fileRoutes');
const userRoutes = require('./routes/userRoutes');
const activityRoutes = require('./routes/activityRoutes');
const commentRoutes = require('./routes/commentRoutes');
const subtaskRoutes = require('./routes/subtaskRoutes');
const labelRoutes = require('./routes/labelRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const timeRoutes = require('./routes/timeRoutes');
const issueRoutes = require('./routes/issueRoutes');
const phaseRoutes = require('./routes/phaseRoutes');
const timesheetRoutes = require('./routes/timesheetRoutes');
const projectDocumentRoutes = require('./routes/projectDocumentRoutes');
const linkRoutes = require('./routes/linkRoutes');
const chatRoutes = require('./routes/chatRoutes');
const dmRoutes = require('./routes/dmRoutes');
const errorHandler = require('./utils/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/subtasks', subtaskRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/phases', phaseRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/documents', projectDocumentRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dm', dmRoutes);
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

const clientDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
