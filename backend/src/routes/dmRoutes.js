const { Router } = require('express');
const authenticate = require('../middleware/auth');
const { startOrGetConversation, getMyConversations, getMessages, sendMessage } = require('../controllers/dmController');

const router = Router();
router.use(authenticate);

router.get('/conversations', getMyConversations);
router.post('/conversations', startOrGetConversation);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/messages', sendMessage);

module.exports = router;
