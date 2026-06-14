const { body } = require('express-validator');

const branchCreateRules = [
  body('name').trim().notEmpty().withMessage('Branch name is required'),
  body('code').trim().notEmpty().withMessage('Branch code is required'),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('pincode').optional().trim(),
  body('phone').optional().trim(),
  body('email').optional().trim().isEmail().withMessage('Please provide a valid email for the branch'),
  body('managerId').optional().trim().isInt({ min: 1 }).withMessage('Invalid manager ID format')
];

const branchUpdateRules = [
  body('name').optional().trim().notEmpty().withMessage('Branch name cannot be empty'),
  body('code').optional().trim().notEmpty().withMessage('Branch code cannot be empty'),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('pincode').optional().trim(),
  body('phone').optional().trim(),
  body('email').optional().trim().isEmail().withMessage('Please provide a valid email for the branch'),
  body('managerId').optional().trim().isInt({ min: 1 }).withMessage('Invalid manager ID format'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

module.exports = { branchCreateRules, branchUpdateRules };
