const LabOrderRepository = require('../repositories/LabOrderRepository');
const BranchRepository = require('../repositories/BranchRepository');
const CustomerRepository = require('../repositories/CustomerRepository');
const CustomError = require('../utils/customError');

class LabOrderService {
  async createLabOrder(orderData, user) {
    const { customerId, branchId } = orderData;
    const finalBranchId = branchId || user.branchId;

    if (!finalBranchId) {
      throw new CustomError('Branch ID is required to create a lab order.', 400);
    }

    // Verify customer exists
    const customer = await CustomerRepository.findById(customerId);
    if (!customer) {
      throw new CustomError(`Customer with ID ${customerId} not found.`, 404);
    }

    // Generate unique order number
    const branch = await BranchRepository.findById(finalBranchId);
    const branchCode = branch ? branch.code.toUpperCase() : 'BRANCH';
    const year = new Date().getFullYear();
    const count = await LabOrderRepository.getLabOrderCount(finalBranchId);
    const sequence = String(count + 1).padStart(4, '0');
    const orderNumber = `LAB-${branchCode}-${year}-${sequence}`;

    const newOrder = {
      branchId: finalBranchId,
      orderNumber,
      status: 'pending',
      ...orderData
    };

    return LabOrderRepository.create(newOrder);
  }

  async getLabOrderById(id) {
    const order = await LabOrderRepository.findById(id);
    if (!order) {
      throw new CustomError('Lab order not found.', 404);
    }
    return order;
  }

  async getAllLabOrders(filters) {
    const page = parseInt(filters.page || '1');
    const limit = parseInt(filters.limit || '10');
    const offset = (page - 1) * limit;

    const { orders, total } = await LabOrderRepository.getAll({
      ...filters,
      limit,
      offset
    });

    const totalPages = Math.ceil(total / limit);

    return {
      orders,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages
      }
    };
  }

  async updateLabOrder(id, orderData) {
    const existing = await this.getLabOrderById(id);
    
    const updated = {
      ...existing,
      ...orderData
    };

    return LabOrderRepository.update(id, updated);
  }

  async updateLabOrderStatus(id, status) {
    await this.getLabOrderById(id);
    
    const allowedStatuses = ['pending', 'in-process', 'completed', 'delivered'];
    if (!allowedStatuses.includes(status)) {
      throw new CustomError(`Invalid status "${status}". Allowed values: ${allowedStatuses.join(', ')}`, 400);
    }

    return LabOrderRepository.updateStatus(id, status);
  }

  async deleteLabOrder(id) {
    await this.getLabOrderById(id);
    return LabOrderRepository.delete(id);
  }
}

module.exports = new LabOrderService();
