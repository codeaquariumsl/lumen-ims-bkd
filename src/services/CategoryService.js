const CategoryRepository = require('../repositories/CategoryRepository');
const CustomError = require('../utils/customError');

class CategoryService {
  async getAllCategories() {
    return CategoryRepository.findAll();
  }

  async getCategoryById(id) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      throw new CustomError('Category not found.', 404);
    }
    return category;
  }

  async createCategory(data) {
    const { name } = data;
    if (!name || !name.trim()) {
      throw new CustomError('Category name is required.', 400);
    }

    const existing = await CategoryRepository.findByName(name);
    if (existing) {
      throw new CustomError(`Category "${name.trim().toLowerCase()}" already exists.`, 400);
    }

    return CategoryRepository.create(data);
  }

  async updateCategory(id, data) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      throw new CustomError('Category not found.', 404);
    }

    if (data.name && data.name.trim().toLowerCase() !== category.name.toLowerCase()) {
      const existing = await CategoryRepository.findByName(data.name);
      if (existing) {
        throw new CustomError(`Category "${data.name.trim().toLowerCase()}" already exists.`, 400);
      }
    }

    return CategoryRepository.update(id, data);
  }

  async deleteCategory(id) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      throw new CustomError('Category not found.', 404);
    }

    const usageCount = await CategoryRepository.getProductUsageCount(category.name);
    if (usageCount > 0) {
      throw new CustomError(
        `Cannot delete category "${category.name}" because ${usageCount} product(s) are assigned to it.`,
        400
      );
    }

    return CategoryRepository.delete(id);
  }
}

module.exports = new CategoryService();
