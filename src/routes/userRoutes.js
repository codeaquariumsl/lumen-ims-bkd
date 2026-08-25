const express = require('express');
const UserController = require('../controllers/UserController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  userCreateRules,
  userUpdateRules,
  resetPasswordRules,
  roleCreateRules,
  roleUpdateRules
} = require('../validations/userValidation');

const router = express.Router();

// Require authentication for all user management routes
router.use(protect);

// Roles and permissions endpoints
router.get('/roles', UserController.getRoles);
router.post('/roles', restrictTo('admin'), validate(roleCreateRules), UserController.createRole);
router.put('/roles/:key', restrictTo('admin'), validate(roleUpdateRules), UserController.updateRole);
router.delete('/roles/:key', restrictTo('admin'), UserController.deleteRole);

// User CRUD endpoints
router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.post('/', restrictTo('admin'), validate(userCreateRules), UserController.create);
router.put('/:id', restrictTo('admin'), validate(userUpdateRules), UserController.update);
router.patch('/:id/password', restrictTo('admin'), validate(resetPasswordRules), UserController.resetPassword);
router.patch('/:id/status', restrictTo('admin'), UserController.toggleStatus);
router.delete('/:id', restrictTo('admin'), UserController.delete);

module.exports = router;
