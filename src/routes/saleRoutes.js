const express = require('express');
const SaleController = require('../controllers/SaleController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { checkoutRules } = require('../validations/saleValidation');

const router = express.Router();

router.use(protect);

router.post('/checkout', validate(checkoutRules), SaleController.checkout);
router.get('/', SaleController.getAll);
router.get('/:id', SaleController.getById);

module.exports = router;
