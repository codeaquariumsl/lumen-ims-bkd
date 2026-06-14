const express = require('express');
const ProductController = require('../controllers/ProductController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { productCreateRules, productUpdateRules, stockUpdateRules } = require('../validations/productValidation');

const router = express.Router();

router.use(protect);

// Core queries
router.get('/', ProductController.getAll);
router.get('/inventory', ProductController.getInventory); // Keep above /:id route to prevent pattern clash
router.get('/:id', ProductController.getById);

// Staff managers mutations
router.post('/', restrictTo('admin', 'manager'), validate(productCreateRules), ProductController.create);
router.put('/:id', restrictTo('admin', 'manager'), validate(productUpdateRules), ProductController.update);
router.delete('/:id', restrictTo('admin', 'manager'), ProductController.delete);

// Direct stock modifications
router.put('/:id/stock', restrictTo('admin', 'manager', 'pharmacist'), validate(stockUpdateRules), ProductController.updateStock);

module.exports = router;
