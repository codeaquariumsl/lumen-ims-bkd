const express = require('express');
const ReportController = require('../controllers/ReportController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Require authentication for all report routes
router.use(protect);

// Sales Reports
router.get('/sales/customer-wise', ReportController.getCustomerWiseSales);
router.get('/sales/item-wise', ReportController.getItemWiseSales);
router.get('/sales/summary', ReportController.getSalesSummary);
router.get('/sales/payment-collections', ReportController.getPaymentTypeWiseDailyCollections);

// Stock / Inventory Reports
router.get('/stock/summary', ReportController.getStockSummary);
router.get('/stock/low-stock', ReportController.getLowStock);
router.get('/stock/category-wise', ReportController.getCategoryStockValuation);

module.exports = router;
