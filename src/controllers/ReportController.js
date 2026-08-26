const ReportService = require('../services/ReportService');
const { sendResponse } = require('../utils/response');

class ReportController {
  async getCustomerWiseSales(req, res, next) {
    try {
      const { startDate, endDate, search } = req.query;
      const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;

      const result = await ReportService.getCustomerWiseSales({
        branchId,
        startDate,
        endDate,
        search
      });

      return sendResponse(res, 200, true, 'Customer-wise sales report generated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getItemWiseSales(req, res, next) {
    try {
      const { startDate, endDate, category, search } = req.query;
      const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;

      const result = await ReportService.getItemWiseSales({
        branchId,
        startDate,
        endDate,
        category,
        search
      });

      return sendResponse(res, 200, true, 'Item-wise sales report generated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getSalesSummary(req, res, next) {
    try {
      const { startDate, endDate, paymentStatus, paymentMethod, search } = req.query;
      const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;

      const result = await ReportService.getSalesSummary({
        branchId,
        startDate,
        endDate,
        paymentStatus,
        paymentMethod,
        search
      });

      return sendResponse(res, 200, true, 'Sales summary report generated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getStockSummary(req, res, next) {
    try {
      const { category, search, stockStatus } = req.query;
      const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;

      const result = await ReportService.getStockSummary({
        branchId,
        category,
        search,
        stockStatus
      });

      return sendResponse(res, 200, true, 'Stock summary report generated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getLowStock(req, res, next) {
    try {
      const { category, search } = req.query;
      const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;

      const result = await ReportService.getLowStock({
        branchId,
        category,
        search
      });

      return sendResponse(res, 200, true, 'Low stock report generated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getCategoryStockValuation(req, res, next) {
    try {
      const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;

      const result = await ReportService.getCategoryStockValuation({
        branchId
      });

      return sendResponse(res, 200, true, 'Category stock valuation report generated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getPaymentTypeWiseDailyCollections(req, res, next) {
    try {
      const { startDate, endDate, paymentMethod } = req.query;
      const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;

      const result = await ReportService.getPaymentTypeWiseDailyCollections({
        branchId,
        startDate,
        endDate,
        paymentMethod
      });

      return sendResponse(res, 200, true, 'Payment type-wise daily collections report generated successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();
