const SaleService = require('../services/SaleService');
const { sendResponse } = require('../utils/response');

class SaleController {
  async checkout(req, res, next) {
    try {
      const sale = await SaleService.processCheckout(req.body, req.user);
      return sendResponse(res, 201, true, 'Sale transaction completed successfully', sale);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const { customerId, startDate, endDate, search, page, limit } = req.query;
      const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;

      const result = await SaleService.getAllSales({
        branchId,
        customerId,
        startDate,
        endDate,
        search,
        page,
        limit
      });

      return sendResponse(res, 200, true, 'Transactions loaded successfully', result.sales, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const sale = await SaleService.getSaleById(req.params.id);
      return sendResponse(res, 200, true, 'Transaction invoice loaded successfully', sale);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SaleController();
