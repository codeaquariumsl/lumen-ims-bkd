const { body } = require('express-validator');

const registerRules = [
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('name').optional().trim().notEmpty().withMessage('Name is required'),
  body('username').optional().trim().matches(/^[a-zA-Z0-9_.-]+$/).withMessage('Invalid username format'),
  body('email').trim().isEmail().withMessage('Please provide a valid email address'),
  body('phone').optional().trim(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().trim().notEmpty().withMessage('Invalid role'),
  body('branchId').optional().custom(val => {
    if (val === null || val === undefined || val === '') return true;
    if (isNaN(parseInt(val))) throw new Error('Invalid branch ID format');
    return true;
  })
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Username or Email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

module.exports = { registerRules, loginRules };

