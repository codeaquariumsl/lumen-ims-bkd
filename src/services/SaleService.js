const SaleRepository = require('../repositories/SaleRepository');
const ProductRepository = require('../repositories/ProductRepository');
const BranchRepository = require('../repositories/BranchRepository');
const CustomError = require('../utils/customError');

class SaleService {
  async processCheckout(checkoutData, staff) {
    const {
      customerId,
      prescriptionId,
      items,
      paymentMethod,
      paymentStatus,
      prescriptionCharges,
      advanceAmount,
      balanceAmount,
      notes
    } = checkoutData;

    const branchId = staff.branchId;

    if (!branchId) {
      throw new CustomError('Staff user must be assigned to a branch to make sales.', 400);
    }

    if ((!items || items.length === 0) && (!prescriptionCharges || parseFloat(prescriptionCharges) === 0)) {
      throw new CustomError('Cart cannot be empty.', 400);
    }

    // 1. Fetch branch details to generate invoice number
    const branch = await BranchRepository.findById(branchId);
    const year = new Date().getFullYear().toString().slice(-2);
    const invoiceCount = await SaleRepository.getInvoiceCount(branchId);
    const sequence = String(invoiceCount + 1).padStart(4, '0');
    const invoiceNumber = `${year}${sequence}`;

    let subtotal = 0;
    let totalDiscountAmount = 0;
    const itemsToInsert = [];

    // 2. Validate items and stock
    if (items && items.length > 0) {
      for (const item of items) {
        const { productId, quantity, discountPercentage: itemDiscPct, discountAmount: itemDiscAmt } = item;
        const product = await ProductRepository.findById(productId);

        if (!product) {
          throw new CustomError(`Product with ID ${productId} not found.`, 404);
        }

        // Check stock levels (only for inventory products)
        const isNonInventory = product.type === 'non-inventory';
        if (!isNonInventory && product.quantity < quantity) {
          throw new CustomError(`Insufficient stock for product "${product.name}". Available: ${product.quantity}, Requested: ${quantity}`, 400);
        }

        const unitPrice = parseFloat(product.selling_price || product.sellingPrice);
        const taxPercentage = 0; // Tax removed
        
        let discountPercentage = itemDiscPct !== undefined && itemDiscPct !== null
          ? parseFloat(itemDiscPct)
          : parseFloat(product.discount_percentage || 0.00);

        const itemSubtotal = unitPrice * quantity;
        let discountAmount = itemDiscAmt !== undefined && itemDiscAmt !== null
          ? parseFloat(itemDiscAmt)
          : itemSubtotal * (discountPercentage / 100);

        if (isNaN(discountAmount) || discountAmount < 0) discountAmount = 0;
        if (discountAmount > itemSubtotal) discountAmount = itemSubtotal;

        const lineTotal = itemSubtotal - discountAmount;

        subtotal += itemSubtotal;
        totalDiscountAmount += discountAmount;

        itemsToInsert.push({
          productId,
          quantity,
          unitPrice,
          taxPercentage: 0,
          discountPercentage,
          discountAmount,
          lineTotal
        });
      }
    }

    const rxFee = parseFloat(prescriptionCharges || 0) || 0;
    const netAmount = (subtotal - totalDiscountAmount) + rxFee;

    let advPaid = parseFloat(advanceAmount || 0);
    if (isNaN(advPaid) || checkoutData.advanceAmount === undefined) {
      advPaid = paymentStatus === 'partial' ? (netAmount * 0.5) : netAmount;
    }

    const balDue = Math.max(0, netAmount - advPaid);
    const finalPaymentStatus = paymentStatus || (balDue > 0 ? 'partial' : 'completed');

    const sale = {
      branchId,
      customerId: customerId || null,
      prescriptionId: prescriptionId || null,
      staffId: staff.id,
      invoiceNumber,
      totalAmount: subtotal,
      taxAmount: 0,
      discountAmount: totalDiscountAmount,
      netAmount,
      prescriptionCharges: rxFee,
      advanceAmount: advPaid,
      balanceAmount: balDue,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: finalPaymentStatus,
      notes
    };

    // Save in Database
    const result = await SaleRepository.createSale(sale, itemsToInsert);

    // Retrieve full transaction details
    return this.getSaleById(result.id);
  }

  async getAllSales(filters) {
    const page = parseInt(filters.page || 1);
    const limit = parseInt(filters.limit || 10);
    const offset = (page - 1) * limit;

    const result = await SaleRepository.getAll({ ...filters, page, limit, offset });
    const totalPages = Math.ceil(result.total / limit);

    return {
      sales: result.sales,
      pagination: {
        totalItems: result.total,
        totalPages,
        currentPage: parseInt(filters.page || 1),
        itemsPerPage: parseInt(filters.limit || 10)
      }
    };
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
}

module.exports = new SaleService();
