const { Router } = require('express');
const authenticate = require('../middleware/auth');
const { create, getByProject, getByTask, remove } = require('../controllers/linkController');

const router = Router();

router.use(authenticate);

router.post('/', create);
router.get('/project/:projectId', getByProject);
router.get('/task/:taskId', getByTask);
router.delete('/:linkId', remove);

module.exports = router;
