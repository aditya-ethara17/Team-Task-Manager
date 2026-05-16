const { Router } = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/auth');
const { getByProject, create, remove, addToTask, removeFromTask } = require('../controllers/labelController');

const router = Router();
router.use(authenticate);

router.get('/project/:projectId', getByProject);
router.post('/project/:projectId', [body('name').trim().notEmpty()], create);
router.delete('/:id', remove);
router.post('/task/:taskId', [body('labelId').notEmpty()], addToTask);
router.delete('/task/:taskId/label/:labelId', removeFromTask);

module.exports = router;
