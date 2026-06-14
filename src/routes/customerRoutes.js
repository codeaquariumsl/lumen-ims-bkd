const express = require('express');
const CustomerController = require('../controllers/CustomerController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { customerCreateRules, customerUpdateRules } = require('../validations/customerValidation');

const router = express.Router();

router.use(protect);

router.get('/', CustomerController.getAll);
router.get('/:id', CustomerController.getById);
router.post('/', validate(customerCreateRules), CustomerController.create);
router.put('/:id', validate(customerUpdateRules), CustomerController.update);
router.delete('/:id', CustomerController.delete);

module.exports = router;
