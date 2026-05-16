const { Router } = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/auth');
const { getByTask, create, remove } = require('../controllers/commentController');

const router = Router();
router.use(authenticate);

router.get('/task/:taskId', getByTask);
router.post('/task/:taskId', [body('content').trim().notEmpty()], create);
router.delete('/:id', remove);

module.exports = router;
