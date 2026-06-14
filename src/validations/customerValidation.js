const { body } = require('express-validator');

const customerCreateRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').optional().trim(),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('email').optional().trim().custom(val => {
    if (!val || val === '') return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      throw new Error('Please provide a valid email address');
    }
    return true;
  }),
  body('dateOfBirth').optional().custom(val => {
    if (!val || val === '') return true;
    if (isNaN(Date.parse(val))) {
      throw new Error('Please provide a valid date for Date of Birth');
    }
    return true;
  }),
  body('gender').optional().isIn(['male', 'female', 'other', '']).withMessage('Invalid gender value'),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('pincode').optional().trim(),
  body('referralSource').optional().trim(),
  body('customerType').optional().isIn(['regular', 'vip', 'wholesale']).withMessage('Invalid customer type')
];

const customerUpdateRules = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim(),
  body('phone').optional().trim().notEmpty().withMessage('Phone number cannot be empty'),
  body('email').optional().trim().custom(val => {
    if (!val || val === '') return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      throw new Error('Please provide a valid email address');
    }
    return true;
  }),
  body('dateOfBirth').optional().custom(val => {
    if (!val || val === '') return true;
    if (isNaN(Date.parse(val))) {
      throw new Error('Please provide a valid date for Date of Birth');
    }
    return true;
  }),
  body('gender').optional().isIn(['male', 'female', 'other', '']).withMessage('Invalid gender value'),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('pincode').optional().trim(),
  body('referralSource').optional().trim(),
  body('customerType').optional().isIn(['regular', 'vip', 'wholesale']).withMessage('Invalid customer type')
];

module.exports = { customerCreateRules, customerUpdateRules };
