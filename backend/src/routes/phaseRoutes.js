const { Router } = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/auth');
const { getByProject, create, update, remove } = require('../controllers/phaseController');

const router = Router();
router.use(authenticate);

router.get('/project/:projectId', getByProject);
router.post('/project/:projectId', [body('name').trim().notEmpty()], create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
