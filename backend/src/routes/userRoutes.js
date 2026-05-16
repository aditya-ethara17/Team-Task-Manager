const { Router } = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/auth');
const { isSuperAdmin } = require('../middleware/roleCheck');
const { getAll, updateRole, remove, search } = require('../controllers/userController');

const router = Router();

router.use(authenticate);
router.get('/search', search);
router.get('/', isSuperAdmin, getAll);
router.patch('/:id/role', isSuperAdmin, [body('role').notEmpty().withMessage('Role required')], updateRole);
router.delete('/:id', isSuperAdmin, remove);

module.exports = router;
