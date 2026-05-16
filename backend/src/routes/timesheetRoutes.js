const { Router } = require('express');
const authenticate = require('../middleware/auth');
const { getMyTimesheet } = require('../controllers/timesheetController');

const router = Router();
router.use(authenticate);
router.get('/my', getMyTimesheet);

module.exports = router;
