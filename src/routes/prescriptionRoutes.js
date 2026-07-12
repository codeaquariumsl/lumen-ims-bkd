const express = require('express');
const PrescriptionController = require('../controllers/PrescriptionController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { prescriptionCreateRules } = require('../validations/prescriptionValidation');

const router = express.Router();

router.use(protect);

router.get('/', PrescriptionController.getAll);
router.get('/:id', PrescriptionController.getById);

// Optometrist, manager or admin can create and update prescriptions
router.post('/', restrictTo('admin', 'manager', 'optometrist'), validate(prescriptionCreateRules), PrescriptionController.create);
router.put('/:id', restrictTo('admin', 'manager', 'optometrist'), validate(prescriptionCreateRules), PrescriptionController.update);

// Deletions restricted to admin/manager
router.delete('/:id', restrictTo('admin', 'manager'), PrescriptionController.delete);

module.exports = router;
