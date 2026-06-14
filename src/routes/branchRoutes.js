const express = require('express');
const BranchController = require('../controllers/BranchController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { branchCreateRules, branchUpdateRules } = require('../validations/branchValidation');

const router = express.Router();

// All branch operations require authentication
router.use(protect);

router.get('/', BranchController.getAll);
router.get('/:id', BranchController.getById);

// Admin-only mutations
router.post('/', restrictTo('admin'), validate(branchCreateRules), BranchController.create);
router.put('/:id', restrictTo('admin'), validate(branchUpdateRules), BranchController.update);

module.exports = router;
