const { Router } = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/auth');
const { getByTask, create, toggle, remove } = require('../controllers/subtaskController');

const router = Router();
router.use(authenticate);

router.get('/task/:taskId', getByTask);
router.post('/task/:taskId', [body('title').trim().notEmpty()], create);
router.patch('/:id/toggle', toggle);
router.delete('/:id', remove);

module.exports = router;
