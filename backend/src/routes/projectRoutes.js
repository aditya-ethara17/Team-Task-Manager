const { Router } = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/auth');
const { isSuperAdmin, isProjectAdmin, isProjectMember } = require('../middleware/roleCheck');
const {
  create, getAll, getById, update, remove, addMember, removeMember
} = require('../controllers/projectController');

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Project name is required')],
  create
);

router.get('/', getAll);
router.get('/:id', isProjectMember, getById);

router.put(
  '/:id',
  [body('name').trim().notEmpty().withMessage('Project name is required')],
  update
);

router.delete('/:id', remove);

router.post(
  '/:id/members',
  [body('email').isEmail().withMessage('Valid email required')],
  isSuperAdmin,
  addMember
);

router.delete('/:id/members/:memberId', isSuperAdmin, removeMember);

module.exports = router;
