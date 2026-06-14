const express = require('express');
const LabOrderController = require('../controllers/LabOrderController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { labOrderCreateRules, labOrderStatusRules } = require('../validations/labOrderValidation');

const router = express.Router();

router.use(protect);

router.get('/', LabOrderController.getAll);
router.get('/:id', LabOrderController.getById);

// Creation allowed for optometrists, admin, manager
router.post('/', restrictTo('admin', 'manager', 'optometrist'), validate(labOrderCreateRules), LabOrderController.create);

// Update details allowed for pharmacist, manager, admin
router.put('/:id', restrictTo('admin', 'manager', 'pharmacist'), LabOrderController.update);

// Status modification allowed for pharmacist, manager, admin
router.put('/:id/status', restrictTo('admin', 'manager', 'pharmacist'), validate(labOrderStatusRules), LabOrderController.updateStatus);

// Deletion restricted to admin/manager
router.delete('/:id', restrictTo('admin', 'manager'), LabOrderController.delete);

module.exports = router;
