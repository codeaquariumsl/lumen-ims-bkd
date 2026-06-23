const express = require('express');
const SettingsController = require('../controllers/SettingsController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', SettingsController.getCompanySettings);
// Admin only for modifying settings
router.post('/', restrictTo('admin'), SettingsController.saveCompanySettings);

module.exports = router;
