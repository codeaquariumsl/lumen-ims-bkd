const { body } = require('express-validator');

const prescriptionCreateRules = [
  body('customerId').trim().notEmpty().withMessage('Customer ID is required')
    .isInt({ min: 1 }).withMessage('Invalid customer ID format'),
  body('prescriptionDate').optional().custom(val => {
    if (!val || val === '') return true;
    if (isNaN(Date.parse(val))) {
      throw new Error('Invalid prescription date');
    }
    return true;
  }),
  body('od_sph').optional().isFloat().withMessage('Right eye sphere must be a number'),
  body('od_cyl').optional().isFloat().withMessage('Right eye cylinder must be a number'),
  body('od_axis').optional().isInt({ min: 0, max: 180 }).withMessage('Right eye axis must be an integer between 0 and 180'),
  body('os_sph').optional().isFloat().withMessage('Left eye sphere must be a number'),
  body('os_cyl').optional().isFloat().withMessage('Left eye cylinder must be a number'),
  body('os_axis').optional().isInt({ min: 0, max: 180 }).withMessage('Left eye axis must be an integer between 0 and 180'),
  body('pd').optional().isFloat().withMessage('Pupillary distance must be a number'),
  body('prescriptionType').optional().isIn(['single', 'bifocal', 'progressive']).withMessage('Invalid prescription type')
];

module.exports = { prescriptionCreateRules };
