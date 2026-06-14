const { body } = require('express-validator');

const checkoutRules = [
  body('customerId').optional().custom(val => {
    if (val === null || val === undefined || val === '') return true;
    if (isNaN(parseInt(val)) || parseInt(val) <= 0) {
      throw new Error('Invalid customer ID format');
    }
    return true;
  }),
  body('items').isArray({ min: 1 }).withMessage('Cart items must be a non-empty array'),
  body('items.*.productId').trim().notEmpty().withMessage('Product ID is required for each cart item')
    .isInt({ min: 1 }).withMessage('Invalid product ID format'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be an integer of at least 1'),
  body('paymentMethod').trim().notEmpty().withMessage('Payment method is required')
    .isIn(['cash', 'card', 'upi', 'cheque', 'credit']).withMessage('Invalid payment method')
];

module.exports = { checkoutRules };
