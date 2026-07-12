const PrescriptionService = require('../services/PrescriptionService');
const { sendResponse } = require('../utils/response');

class PrescriptionController {
  async getAll(req, res, next) {
    try {
      const { search, customerId, page, limit } = req.query;
      const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;

      const result = await PrescriptionService.getAllPrescriptions({
        branchId,
        customerId,
        search,
        page,
        limit
      });

      return sendResponse(res, 200, true, 'Prescriptions loaded successfully', result.prescriptions, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const prescription = await PrescriptionService.getPrescriptionById(req.params.id);
      return sendResponse(res, 200, true, 'Prescription loaded successfully', prescription);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const prescription = await PrescriptionService.createPrescription(req.body, req.user);
      return sendResponse(res, 201, true, 'Prescription created successfully', prescription);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const prescription = await PrescriptionService.updatePrescription(req.params.id, req.body);
      return sendResponse(res, 200, true, 'Prescription updated successfully', prescription);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await PrescriptionService.deletePrescription(req.params.id);
      return sendResponse(res, 200, true, 'Prescription deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PrescriptionController();
