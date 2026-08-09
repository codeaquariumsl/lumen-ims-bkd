const express = require('express');
const CategoryController = require('../controllers/CategoryController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', CategoryController.getAll);
router.get('/:id', CategoryController.getById);
router.post('/', restrictTo('admin', 'manager'), CategoryController.create);
router.put('/:id', restrictTo('admin', 'manager'), CategoryController.update);
router.delete('/:id', restrictTo('admin', 'manager'), CategoryController.delete);

module.exports = router;
