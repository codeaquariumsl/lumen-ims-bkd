const UserService = require('../services/UserService');
const { sendResponse } = require('../utils/response');

class AuthController {
  async register(req, res, next) {
    try {
      const user = await UserService.register(req.body);
      return sendResponse(res, 201, true, 'User registered successfully', { user });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, token } = await UserService.login(email, password);
      return sendResponse(res, 200, true, 'Login successful', { user, token });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await UserService.getById(req.user.id);
      return sendResponse(res, 200, true, 'User profile loaded successfully', { user });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      return sendResponse(res, 200, true, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
