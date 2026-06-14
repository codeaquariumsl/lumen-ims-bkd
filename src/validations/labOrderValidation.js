const { body } = require('express-validator');

const labOrderCreateRules = [
  body('customerId').trim().notEmpty().withMessage('Customer ID is required')
    .isInt({ min: 1 }).withMessage('Invalid customer ID format'),
  body('prescriptionId').optional().custom(val => {
    if (val === null || val === undefined || val === '') return true;
    if (isNaN(parseInt(val)) || parseInt(val) <= 0) {
      throw new Error('Invalid prescription ID format');
    }
    return true;
  }),
  body('saleId').optional().custom(val => {
    if (val === null || val === undefined || val === '') return true;
    if (isNaN(parseInt(val)) || parseInt(val) <= 0) {
      throw new Error('Invalid sale ID format');
    }
    return true;
  }),
  body('deliveryDate').optional().custom(val => {
    if (!val || val === '') return true;
    if (isNaN(Date.parse(val))) {
      throw new Error('Invalid expected delivery date');
    }
    return true;
  }),
  body('totalCost').optional().isFloat({ min: 0 }).withMessage('Total cost must be a non-negative number')
];

const labOrderStatusRules = [
  body('status').trim().notEmpty().withMessage('Status is required')
    .isIn(['pending', 'in-process', 'completed', 'delivered']).withMessage('Invalid lab order status value')
];

module.exports = { labOrderCreateRules, labOrderStatusRules };
