const { Router } = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/auth');
const { create, update, remove, search, kanban, getById, watch, watchStatus, myTasks, myKanban } = require('../controllers/taskController');

const router = Router();

router.use(authenticate);

router.get('/search', search);
router.get('/kanban/:projectId', kanban);
router.get('/my', myTasks);
router.get('/my/kanban', myKanban);
router.get('/:id', getById);
router.get('/:id/watch', watchStatus);
router.post('/:id/watch', watch);

router.post(
  '/project/:projectId',
  [body('title').trim().notEmpty().withMessage('Task title is required')],
  create
);

router.put(
  '/:id',
  [body('title').optional().trim().notEmpty().withMessage('Task title cannot be empty')],
  update
);

router.delete('/:id', remove);

module.exports = router;
