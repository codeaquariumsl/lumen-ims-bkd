const { body } = require('express-validator');

const productCreateRules = [
  body('code').trim().notEmpty().withMessage('Product code is required'),
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('costPrice').isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  body('discountPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount percentage must be between 0 and 100'),
  body('taxPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Tax percentage must be between 0 and 100'),
  body('minStock').optional().isInt({ min: 0 }).withMessage('Minimum stock level must be a non-negative integer'),
  body('maxStock').optional().isInt({ min: 0 }).withMessage('Maximum stock level must be a non-negative integer'),
  body('quantity').optional().isInt({ min: 0 }).withMessage('Initial quantity must be a non-negative integer')
];

const productUpdateRules = [
  body('code').optional().trim().notEmpty().withMessage('Product code cannot be empty'),
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('costPrice').optional().isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
  body('sellingPrice').optional().isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  body('discountPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount percentage must be between 0 and 100'),
  body('taxPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Tax percentage must be between 0 and 100'),
  body('minStock').optional().isInt({ min: 0 }).withMessage('Minimum stock level must be a non-negative integer'),
  body('maxStock').optional().isInt({ min: 0 }).withMessage('Maximum stock level must be a non-negative integer')
];

const stockUpdateRules = [
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('batchNumber').optional().trim(),
  body('serialNumber').optional().trim(),
  body('expiryDate').optional().custom(val => {
    if (!val || val === '') return true;
    if (isNaN(Date.parse(val))) {
      throw new Error('Please provide a valid expiry date');
    }
    return true;
  })
];

module.exports = { productCreateRules, productUpdateRules, stockUpdateRules };
