const UserRepository = require('../repositories/UserRepository');
const SettingsRepository = require('../repositories/SettingsRepository');
const bcrypt = require('bcryptjs');
const CustomError = require('../utils/customError');
const { signToken } = require('../utils/jwt');

class UserService {
  async register(userData) {
    const { name, email, password, role, branchId } = userData;

    // Check if user already exists
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new CustomError('User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await UserRepository.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'staff',
      branchId: branchId || null,
      isActive: 1
    });

    // Remove password
    const result = { ...newUser };
    delete result.password;
    return result;
  }

  async login(email, password) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new CustomError('Invalid email or password', 401);
    }

    if (!user.is_active) {
      throw new CustomError('User account is deactivated', 403);
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new CustomError('Invalid email or password', 401);
    }

    // Update last login
    await UserRepository.updateLastLogin(user.id);

    // Sign token
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branch_id
    });

    // Remove password
    const userResult = { ...user };
    delete userResult.password;
    
    // Inject company details
    const companyDetails = await SettingsRepository.getCompanyDetails();
    userResult.companyDetails = companyDetails || null;

    return { user: userResult, token };
  }

  async getById(id) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    delete user.password;
    
    // Inject company details
    const companyDetails = await SettingsRepository.getCompanyDetails();
    user.companyDetails = companyDetails || null;
    
    return user;
  }

  async getAll(filters) {
    return UserRepository.getAll(filters);
  }
}

module.exports = new UserService();
