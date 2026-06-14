const express = require('express');
const AnalyticsController = require('../controllers/AnalyticsController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/dashboard', AnalyticsController.getDashboardSummary);
router.get('/charts', AnalyticsController.getCharts);

module.exports = router;
