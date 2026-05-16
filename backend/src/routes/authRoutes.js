const { Router } = require('express');
const { body } = require('express-validator');
const { signup, login } = require('../controllers/authController');

const router = Router();

router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email required').bail().toLowerCase(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  signup
);

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Valid email required').bail().toLowerCase(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  login
);

module.exports = router;
