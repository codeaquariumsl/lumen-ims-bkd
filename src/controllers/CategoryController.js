const CategoryService = require('../services/CategoryService');
const { sendResponse } = require('../utils/response');

class CategoryController {
  async getAll(req, res, next) {
    try {
      const categories = await CategoryService.getAllCategories();
      return sendResponse(res, 200, true, 'Categories loaded successfully', categories);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const category = await CategoryService.getCategoryById(req.params.id);
      return sendResponse(res, 200, true, 'Category loaded successfully', category);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const category = await CategoryService.createCategory(req.body);
      return sendResponse(res, 201, true, 'Category created successfully', category);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const category = await CategoryService.updateCategory(req.params.id, req.body);
      return sendResponse(res, 200, true, 'Category updated successfully', category);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await CategoryService.deleteCategory(req.params.id);
      return sendResponse(res, 200, true, 'Category deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();
