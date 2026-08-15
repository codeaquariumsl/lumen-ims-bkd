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
    const { name, code } = data;
    if (!name || !name.trim()) {
      throw new CustomError('Category name is required.', 400);
    }
    if (!code || !code.trim() || !/^[A-Za-z]{2}$/.test(code.trim())) {
      throw new CustomError('Category code is required and must be exactly 2 letters.', 400);
    }

    const uppercaseCode = code.trim().toUpperCase();

    const existingName = await CategoryRepository.findByName(name);
    if (existingName) {
      throw new CustomError(`Category "${name.trim().toLowerCase()}" already exists.`, 400);
    }

    const existingCode = await CategoryRepository.findByCode(uppercaseCode);
    if (existingCode) {
      throw new CustomError(`Category code "${uppercaseCode}" is already in use.`, 400);
    }

    return CategoryRepository.create({
      ...data,
      code: uppercaseCode
    });
  }

  async updateCategory(id, data) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      throw new CustomError('Category not found.', 404);
    }

    if (data.code !== undefined) {
      if (!data.code || !data.code.trim() || !/^[A-Za-z]{2}$/.test(data.code.trim())) {
        throw new CustomError('Category code must be exactly 2 letters.', 400);
      }
      const uppercaseCode = data.code.trim().toUpperCase();
      const existingCode = await CategoryRepository.findByCode(uppercaseCode);
      if (existingCode && existingCode.id !== parseInt(id)) {
        throw new CustomError(`Category code "${uppercaseCode}" is already in use.`, 400);
      }
      data.code = uppercaseCode;
    }

    if (data.name && data.name.trim().toLowerCase() !== category.name.toLowerCase()) {
      const existing = await CategoryRepository.findByName(data.name);
      if (existing && existing.id !== parseInt(id)) {
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
