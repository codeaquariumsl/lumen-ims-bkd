const SaleRepository = require('../repositories/SaleRepository');
const ProductRepository = require('../repositories/ProductRepository');
const BranchRepository = require('../repositories/BranchRepository');
const CustomError = require('../utils/customError');

class SaleService {
  async processCheckout(checkoutData, staff) {
    const { customerId, items, paymentMethod, notes } = checkoutData;
    const branchId = staff.branchId;

    if (!branchId) {
      throw new CustomError('Staff user must be assigned to a branch to make sales.', 400);
    }

    if (!items || items.length === 0) {
      throw new CustomError('Cart cannot be empty.', 400);
    }

    // 1. Fetch branch details to generate invoice number
    const branch = await BranchRepository.findById(branchId);
    const branchCode = branch ? branch.code.toUpperCase() : 'BRANCH';
    const year = new Date().getFullYear().toString().slice(-2);
    const invoiceCount = await SaleRepository.getInvoiceCount(branchId);
    const sequence = String(invoiceCount + 1).padStart(4, '0');
    const invoiceNumber = `${year}${sequence}`;

    let subtotal = 0;
    const itemsToInsert = [];

    // 2. Validate items and stock
    for (const item of items) {
      const { productId, quantity } = item;
      const product = await ProductRepository.findById(productId);

      if (!product) {
        throw new CustomError(`Product with ID ${productId} not found.`, 404);
      }

      // Check stock levels
      if (product.quantity < quantity) {
        throw new CustomError(`Insufficient stock for product "${product.name}". Available: ${product.quantity}, Requested: ${quantity}`, 400);
      }

      const unitPrice = parseFloat(product.selling_price || product.sellingPrice);
      const taxPercentage = parseFloat(product.tax_percentage || 5.00);
      const discountPercentage = parseFloat(product.discount_percentage || 0.00);

      // Line calculations
      const itemSubtotal = unitPrice * quantity;
      const discountAmount = itemSubtotal * (discountPercentage / 100);
      const taxedBasis = itemSubtotal - discountAmount;
      const lineTotal = taxedBasis + (taxedBasis * (taxPercentage / 100));

      subtotal += lineTotal;

      itemsToInsert.push({
        productId,
        quantity,
        unitPrice,
        taxPercentage,
        discountPercentage,
        lineTotal
      });
    }

    // Default calculations for the total sale
    const discountAmount = 0.00; // Can extend if flat coupon discounts are added
    const netAmount = subtotal - discountAmount;
    const taxAmount = itemsToInsert.reduce((sum, item) => sum + (item.lineTotal - (item.unitPrice * item.quantity)), 0);

    const sale = {
      branchId,
      customerId,
      staffId: staff.id,
      invoiceNumber,
      totalAmount: subtotal,
      taxAmount,
      discountAmount,
      netAmount,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: 'completed',
      notes
    };

    // Save in Database
    const result = await SaleRepository.createSale(sale, itemsToInsert);

    // Retrieve full transaction details
    return this.getSaleById(result.id);
  }

  async getSaleById(id) {
    const sale = await SaleRepository.findById(id);
    if (!sale) {
      throw new CustomError('Transaction invoice not found.', 404);
    }
    const items = await SaleRepository.findItemsBySaleId(id);
    return {
      ...sale,
      items
    };
  }

  async getAllSales(filters) {
    const page = parseInt(filters.page || '1');
    const limit = parseInt(filters.limit || '10');
    const offset = (page - 1) * limit;

    const { sales, total } = await SaleRepository.getAll({
      ...filters,
      limit,
      offset
    });

    const totalPages = Math.ceil(total / limit);

    return {
      sales,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages
      }
    };
  }
}

module.exports = new SaleService();
