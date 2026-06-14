const CustomerService = require('../services/CustomerService');
const { sendResponse } = require('../utils/response');

class CustomerController {
  async getAll(req, res, next) {
    try {
      const { search, customerType, page, limit } = req.query;
      
      // Filter by branch depending on user permissions
      const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;

      const result = await CustomerService.getAllCustomers({
        search,
        customerType,
        branchId,
        page,
        limit
      });

      return sendResponse(res, 200, true, 'Customers loaded successfully', result.customers, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const customer = await CustomerService.getCustomerById(req.params.id);
      return sendResponse(res, 200, true, 'Customer loaded successfully', customer);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const customer = await CustomerService.createCustomer(req.body, req.user.branchId);
      return sendResponse(res, 201, true, 'Customer created successfully', customer);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const customer = await CustomerService.updateCustomer(req.params.id, req.body);
      return sendResponse(res, 200, true, 'Customer updated successfully', customer);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await CustomerService.deleteCustomer(req.params.id);
      return sendResponse(res, 200, true, 'Customer deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();
