const { Router } = require('express');
const authenticate = require('../middleware/auth');
const { getMyNotifications, markRead, markAllRead } = require('../controllers/notificationController');

const router = Router();
router.use(authenticate);

router.get('/', getMyNotifications);
router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);

module.exports = router;
