const { Router } = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/auth');
const { getByTask, create, remove } = require('../controllers/timeController');

const router = Router();
router.use(authenticate);

router.get('/task/:taskId', getByTask);
router.post('/task/:taskId', [body('hours').isFloat({ gt: 0 })], create);
router.delete('/:id', remove);

module.exports = router;
