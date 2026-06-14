const AnalyticsService = require('../services/AnalyticsService');
const { sendResponse } = require('../utils/response');

class AnalyticsController {
  async getDashboardSummary(req, res, next) {
    try {
      const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;
      const data = await AnalyticsService.getDashboardData(branchId);
      return sendResponse(res, 200, true, 'Dashboard summary metrics loaded successfully', data);
    } catch (error) {
      next(error);
    }
  }

  async getCharts(req, res, next) {
    try {
      const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;
      const data = await AnalyticsService.getAnalyticsCharts(branchId);
      return sendResponse(res, 200, true, 'Analytics charts loaded successfully', data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
