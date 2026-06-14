const express = require('express');
const AuthController = require('../controllers/AuthController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { registerRules, loginRules } = require('../validations/authValidation');

const router = express.Router();

router.post('/register', validate(registerRules), AuthController.register);
router.post('/login', validate(loginRules), AuthController.login);
router.get('/me', protect, AuthController.getMe);
router.post('/logout', AuthController.logout);

module.exports = router;
