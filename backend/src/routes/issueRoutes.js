const { Router } = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/auth');
const { create, update, remove, getByProject, getById, kanban } = require('../controllers/issueController');

const router = Router();
router.use(authenticate);

router.get('/project/:projectId', getByProject);
router.get('/kanban/:projectId', kanban);
router.get('/:id', getById);
router.post('/project/:projectId', [body('title').trim().notEmpty()], create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
