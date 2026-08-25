const UserService = require('../services/UserService');
const { sendResponse } = require('../utils/response');

class UserController {
  async getAll(req, res, next) {
    try {
      const { search, role, branchId, status } = req.query;

      const result = await UserService.getAll({
        search,
        role,
        branchId,
        status
      });

      return sendResponse(res, 200, true, 'Users loaded successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await UserService.getById(req.params.id);
      return sendResponse(res, 200, true, 'User details loaded successfully', user);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const user = await UserService.createUser(req.body);
      return sendResponse(res, 201, true, 'User created successfully', user);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const user = await UserService.updateUser(req.params.id, req.body);
      return sendResponse(res, 200, true, 'User updated successfully', user);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { password } = req.body;
      const result = await UserService.resetPassword(req.params.id, password);
      return sendResponse(res, 200, true, result.message || 'Password reset successfully');
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const { isActive } = req.body;
      const user = await UserService.toggleStatus(req.params.id, isActive);
      return sendResponse(
        res,
        200,
        true,
        `User ${user.is_active ? 'activated' : 'deactivated'} successfully`,
        user
      );
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await UserService.deleteUser(req.params.id, req.user.id);
      return sendResponse(res, 200, true, result.message || 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // --- Roles & Permissions Controllers ---

  async getRoles(req, res, next) {
    try {
      const data = await UserService.getRolesAndPermissions();
      return sendResponse(res, 200, true, 'Roles and permissions loaded successfully', data);
    } catch (error) {
      next(error);
    }
  }

  async createRole(req, res, next) {
    try {
      const role = await UserService.createRole(req.body);
      return sendResponse(res, 201, true, 'Role created successfully', role);
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req, res, next) {
    try {
      const role = await UserService.updateRole(req.params.key, req.body);
      return sendResponse(res, 200, true, 'Role updated successfully', role);
    } catch (error) {
      next(error);
    }
  }

  async deleteRole(req, res, next) {
    try {
      const result = await UserService.deleteRole(req.params.key);
      return sendResponse(res, 200, true, result.message || 'Role deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
