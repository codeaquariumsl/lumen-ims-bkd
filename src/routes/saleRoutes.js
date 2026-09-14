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
router.post('/:id/collect-payment', SaleController.collectPayment);
router.post('/:id/cancel', SaleController.cancelSale);
router.patch('/:id/cancel', SaleController.cancelSale);

module.exports = router;
