const ProductService = require('../services/ProductService');
const { sendResponse } = require('../utils/response');

class ProductController {
  async getAll(req, res, next) {
    try {
      const { search, category, page, limit } = req.query;
      const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;

      const result = await ProductService.getAllProducts({
        search,
        category,
        branchId,
        page,
        limit
      });

      return sendResponse(res, 200, true, 'Products loaded successfully', result.products, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const product = await ProductService.getProductById(req.params.id);
      return sendResponse(res, 200, true, 'Product loaded successfully', product);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const product = await ProductService.createProduct(req.body, req.user.branchId);
      return sendResponse(res, 201, true, 'Product created successfully', product);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const product = await ProductService.updateProduct(req.params.id, req.body);
      return sendResponse(res, 200, true, 'Product updated successfully', product);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await ProductService.deleteProduct(req.params.id);
      return sendResponse(res, 200, true, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // Inventory / Stock actions
  async getInventory(req, res, next) {
    try {
      const { category, search } = req.query;
      const branchId = req.user.role === 'admin' ? req.query.branchId : req.user.branchId;

      const items = await ProductService.getInventoryStatus({
        branchId,
        category,
        search
      });

      return sendResponse(res, 200, true, 'Inventory status loaded successfully', items);
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req, res, next) {
    try {
      const { id } = req.params;
      const branchId = req.user.branchId || req.body.branchId;

      if (!branchId) {
        return res.status(400).json({ success: false, message: 'Branch ID is required to update stock.' });
      }
      
      const product = await ProductService.updateStockDetails(id, branchId, req.body);
      return sendResponse(res, 200, true, 'Stock level updated successfully', product);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
