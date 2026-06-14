const ProductRepository = require('../repositories/ProductRepository');
const CustomError = require('../utils/customError');

class ProductService {
  async createProduct(productData, userBranchId) {
    const { code, branchId, quantity } = productData;
    const finalBranchId = branchId || userBranchId;

    if (!finalBranchId) {
      throw new CustomError('Branch ID is required to create a product.', 400);
    }

    const existing = await ProductRepository.findByCode(code, finalBranchId);
    if (existing) {
      throw new CustomError(`Product with code "${code}" already exists in this branch.`, 400);
    }

    const product = {
      ...productData,
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

  async getAllProducts(filters) {
    const page = parseInt(filters.page || '1');
    const limit = parseInt(filters.limit || '10');
    const offset = (page - 1) * limit;

    const { products, total } = await ProductRepository.getAll({
      ...filters,
      limit,
      offset
    });

    const totalPages = Math.ceil(total / limit);

    return {
      products,
      pagination: {
        page,
        limit,
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
}

module.exports = new ProductService();
