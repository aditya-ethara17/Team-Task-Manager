const { Router } = require('express');
const authenticate = require('../middleware/auth');
const { send, getByProject, getByTask, getGlobal } = require('../controllers/chatController');

const router = Router();

router.use(authenticate);

router.get('/global', getGlobal);
router.post('/', send);
router.get('/project/:projectId', getByProject);
router.get('/task/:taskId', getByTask);

module.exports = router;
