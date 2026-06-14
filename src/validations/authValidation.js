const { body } = require('express-validator');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Please provide a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['admin', 'manager', 'staff', 'sales', 'pharmacist', 'optometrist', 'accountant']).withMessage('Invalid role'),
  body('branchId').optional().isInt({ min: 1 }).withMessage('Invalid branch ID format')
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required')
];

module.exports = { registerRules, loginRules };
