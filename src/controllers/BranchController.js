const BranchService = require('../services/BranchService');
const { sendResponse } = require('../utils/response');

class BranchController {
  async getAll(req, res, next) {
    try {
      const filters = {};
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }
      const branches = await BranchService.getAllBranches(filters);
      return sendResponse(res, 200, true, 'Branches retrieved successfully', branches);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const branch = await BranchService.getBranchById(req.params.id);
      return sendResponse(res, 200, true, 'Branch retrieved successfully', branch);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const branch = await BranchService.createBranch(req.body);
      return sendResponse(res, 201, true, 'Branch created successfully', branch);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const branch = await BranchService.updateBranch(req.params.id, req.body);
      return sendResponse(res, 200, true, 'Branch updated successfully', branch);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BranchController();
