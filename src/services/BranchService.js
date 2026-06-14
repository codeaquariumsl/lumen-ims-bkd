const BranchRepository = require('../repositories/BranchRepository');
const CustomError = require('../utils/customError');

class BranchService {
  async createBranch(branchData) {
    const { code } = branchData;

    // Check if code is unique
    const existing = await BranchRepository.findByCode(code);
    if (existing) {
      throw new CustomError(`Branch with code "${code}" already exists`, 400);
    }

    const newBranch = await BranchRepository.create(branchData);

    return newBranch;
  }

  async getBranchById(id) {
    const branch = await BranchRepository.findById(id);
    if (!branch) {
      throw new CustomError('Branch not found', 404);
    }
    return branch;
  }

  async getAllBranches(filters) {
    return BranchRepository.getAll(filters);
  }

  async updateBranch(id, branchData) {
    // Check if branch exists
    await this.getBranchById(id);

    // If code is changing, ensure it is unique
    if (branchData.code) {
      const existing = await BranchRepository.findByCode(branchData.code);
      if (existing && existing.id !== id) {
        throw new CustomError(`Branch with code "${branchData.code}" already exists`, 400);
      }
    }

    return BranchRepository.update(id, branchData);
  }
}

module.exports = new BranchService();
