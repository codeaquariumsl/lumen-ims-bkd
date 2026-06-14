const LabOrderService = require('../services/LabOrderService');
const { sendResponse } = require('../utils/response');

class LabOrderController {
  async getAll(req, res, next) {
    try {
      const { search, status, page, limit } = req.query;
      const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;

      const result = await LabOrderService.getAllLabOrders({
        branchId,
        status,
        search,
        page,
        limit
      });

      return sendResponse(res, 200, true, 'Lab orders loaded successfully', result.orders, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const order = await LabOrderService.getLabOrderById(req.params.id);
      return sendResponse(res, 200, true, 'Lab order loaded successfully', order);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const order = await LabOrderService.createLabOrder(req.body, req.user);
      return sendResponse(res, 201, true, 'Lab order created successfully', order);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const order = await LabOrderService.updateLabOrder(req.params.id, req.body);
      return sendResponse(res, 200, true, 'Lab order updated successfully', order);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const order = await LabOrderService.updateLabOrderStatus(req.params.id, status);
      return sendResponse(res, 200, true, 'Lab order status updated successfully', order);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await LabOrderService.deleteLabOrder(req.params.id);
      return sendResponse(res, 200, true, 'Lab order deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LabOrderController();
