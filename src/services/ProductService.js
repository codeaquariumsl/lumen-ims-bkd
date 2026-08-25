const ProductRepository = require('../repositories/ProductRepository');
const CategoryRepository = require('../repositories/CategoryRepository');
const CustomError = require('../utils/customError');

class ProductService {
  async getNextProductCode(categoryName) {
    if (!categoryName) {
      throw new CustomError('Category name is required to generate product code.', 400);
    }

    const categoryObj = await CategoryRepository.findByName(categoryName);
    let categoryCode = 'PR';

    if (categoryObj && categoryObj.code) {
      categoryCode = categoryObj.code.trim().toUpperCase();
    } else if (categoryName.trim().length >= 2) {
      categoryCode = categoryName.trim().substring(0, 2).toUpperCase();
    }

    const prefixPattern = `${categoryCode}%`;
    const existingProducts = await ProductRepository.findProductsByCodePrefix(prefixPattern);

    let maxSeq = 0;
    const regex = new RegExp(`^${categoryCode}(\\d+)$`, 'i');

    for (const prod of existingProducts) {
      const match = prod.code ? prod.code.match(regex) : null;
      if (match && match[1]) {
        const seq = parseInt(match[1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }

    const nextSeq = maxSeq + 1;
    const nextCode = `${categoryCode}${String(nextSeq).padStart(3, '0')}`;
    const autoBarcode = `01${nextCode}`;

    return {
      code: nextCode,
      barcode: autoBarcode,
      categoryCode,
      sequence: nextSeq
    };
  }

  async createProduct(productData, userBranchId) {
    let { code, category, branchId, quantity, barcode, type } = productData;
    const finalBranchId = branchId || userBranchId;

    if (!finalBranchId) {
      throw new CustomError('Branch ID is required to create a product.', 400);
    }

    // Auto-generate code if not provided
    if (!code && category) {
      const nextData = await this.getNextProductCode(category);
      code = nextData.code;
    }

    if (!code) {
      throw new CustomError('Product code is required.', 400);
    }

    const existing = await ProductRepository.findByCode(code, finalBranchId);
    if (existing) {
      throw new CustomError(`Product with code "${code}" already exists in this branch.`, 400);
    }

    // Auto-generate barcode if missing: 01 + product code
    const finalBarcode = barcode && barcode.trim() !== '' ? barcode.trim() : `01${code}`;
    const finalType = type || 'inventory';

    const product = {
      ...productData,
      code,
      barcode: finalBarcode,
      type: finalType,
      branchId: finalBranchId
    };

    const initialQuantity = parseInt(quantity || 0);

    return ProductRepository.create(product, initialQuantity);
  }

  async getProductById(id) {
    const product = await ProductRepository.findById(id);
    if (!product) {
      throw new CustomError('Product not found.', 404);
    }
    return product;
  }

  async getAllProducts(filters = {}) {
    const hasLimit = filters.limit !== undefined && filters.limit !== null && filters.limit !== '' && filters.limit !== 'all';
    const limit = hasLimit ? parseInt(filters.limit, 10) : null;
    const page = filters.page ? parseInt(filters.page, 10) : 1;
    const offset = limit ? (page - 1) * limit : 0;

    const { products, total } = await ProductRepository.getAll({
      ...filters,
      limit,
      offset
    });

    const totalPages = limit ? Math.ceil(total / limit) : 1;

    return {
      products,
      pagination: {
        page,
        limit: limit !== null ? limit : total,
        totalItems: total,
        totalPages
      }
    };
  }

  async updateProduct(id, productData) {
    const existing = await this.getProductById(id);

    if (productData.code && productData.code !== existing.code) {
      const duplicate = await ProductRepository.findByCode(productData.code, existing.branch_id);
      if (duplicate && duplicate.id !== id) {
        throw new CustomError(`Product with code "${productData.code}" already exists in this branch.`, 400);
      }
    }

    const updatedData = {
      ...existing,
      ...productData
    };

    return ProductRepository.update(id, updatedData);
  }

  async deleteProduct(id) {
    await this.getProductById(id);
    return ProductRepository.delete(id);
  }

  async getInventoryStatus(filters) {
    return ProductRepository.getInventoryStatus(filters);
  }

  async updateStockDetails(productId, branchId, details) {
    await this.getProductById(productId);
    await ProductRepository.setInventoryDetails(productId, branchId, details);
    return this.getProductById(productId);
  }

  async getInventorySummary(branchId) {
    return ProductRepository.getInventorySummary(branchId);
  }
}

module.exports = new ProductService();
