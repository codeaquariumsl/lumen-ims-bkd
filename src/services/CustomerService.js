const CustomerRepository = require('../repositories/CustomerRepository');
const CustomError = require('../utils/customError');

class CustomerService {
  async createCustomer(customerData, userBranchId) {
    const { phone, branchId } = customerData;
    
    const finalBranchId = branchId || userBranchId;
    if (!finalBranchId) {
      throw new CustomError('Branch ID is required to create a customer.', 400);
    }

    // Check if phone number is already registered
    if (phone) {
      const existing = await CustomerRepository.findByPhone(phone);
      if (existing) {
        throw new CustomError(`Customer with phone number "${phone}" already exists.`, 400);
      }
    }

    const newCustomer = await CustomerRepository.create({
      ...customerData,
      branchId: finalBranchId
    });

    return newCustomer;
  }

  async getCustomerById(id) {
    const customer = await CustomerRepository.findById(id);
    if (!customer) {
      throw new CustomError('Customer not found.', 404);
    }
    return customer;
  }

  async getAllCustomers(filters) {
    const page = parseInt(filters.page || '1');
    const limit = parseInt(filters.limit || '10');
    const offset = (page - 1) * limit;

    const { customers, total } = await CustomerRepository.getAll({
      ...filters,
      limit,
      offset
    });

    const totalPages = Math.ceil(total / limit);

    return {
      customers,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages
      }
    };
  }

  async updateCustomer(id, customerData) {
    const existing = await this.getCustomerById(id);

    if (customerData.phone && customerData.phone !== existing.phone) {
      const duplicate = await CustomerRepository.findByPhone(customerData.phone);
      if (duplicate && duplicate.id !== id) {
        throw new CustomError(`Customer with phone number "${customerData.phone}" already exists.`, 400);
      }
    }

    const updatedData = {
      ...existing,
      ...customerData
    };

    return CustomerRepository.update(id, updatedData);
  }

  async deleteCustomer(id) {
    await this.getCustomerById(id);
    return CustomerRepository.delete(id);
  }
}

module.exports = new CustomerService();
