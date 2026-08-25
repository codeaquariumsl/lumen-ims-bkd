const { body } = require('express-validator');

const userCreateRules = [
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('username')
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, dashes, and periods')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('email').trim().isEmail().withMessage('Please provide a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('phone').optional().trim(),
  body('role').optional().trim().notEmpty().withMessage('Role cannot be empty'),
  body('branchId').optional().custom(val => {
    if (val === null || val === undefined || val === '') return true;
    if (isNaN(parseInt(val))) {
      throw new Error('Invalid branch ID');
    }
    return true;
  }),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

const userUpdateRules = [
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('username')
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, dashes, and periods')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('email').optional().trim().isEmail().withMessage('Please provide a valid email address'),
  body('phone').optional().trim(),
  body('role').optional().trim().notEmpty().withMessage('Role cannot be empty'),
  body('branchId').optional().custom(val => {
    if (val === null || val === undefined || val === '') return true;
    if (isNaN(parseInt(val))) {
      throw new Error('Invalid branch ID');
    }
    return true;
  }),
  body('isActive').optional()
];

const resetPasswordRules = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

const roleCreateRules = [
  body('name').trim().notEmpty().withMessage('Role name is required'),
  body('description').optional().trim(),
  body('permissions').optional().isArray().withMessage('Permissions must be an array of strings')
];

const roleUpdateRules = [
  body('name').optional().trim().notEmpty().withMessage('Role name cannot be empty'),
  body('description').optional().trim(),
  body('permissions').optional().isArray().withMessage('Permissions must be an array of strings')
];

module.exports = {
  userCreateRules,
  userUpdateRules,
  resetPasswordRules,
  roleCreateRules,
  roleUpdateRules
};
