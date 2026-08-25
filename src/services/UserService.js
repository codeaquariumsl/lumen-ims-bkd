const UserRepository = require('../repositories/UserRepository');
const SettingsRepository = require('../repositories/SettingsRepository');
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const CustomError = require('../utils/customError');
const { signToken } = require('../utils/jwt');

// Master permissions catalog grouped by module
const MASTER_PERMISSIONS = [
  {
    module: 'Dashboard & Analytics',
    permissions: [
      { key: 'view_dashboard', label: 'View Dashboard' },
      { key: 'view_analytics', label: 'View Analytics & Statistics' },
    ]
  },
  {
    module: 'Prescriptions',
    permissions: [
      { key: 'view_prescriptions', label: 'View Prescriptions' },
      { key: 'create_prescriptions', label: 'Create Prescriptions' },
      { key: 'edit_prescriptions', label: 'Edit Prescriptions' },
      { key: 'delete_prescriptions', label: 'Delete Prescriptions' },
    ]
  },
  {
    module: 'POS & Invoices',
    permissions: [
      { key: 'view_pos', label: 'Access POS Checkout' },
      { key: 'create_sales', label: 'Create Sales & Orders' },
      { key: 'view_invoices', label: 'View Invoices' },
      { key: 'edit_invoices', label: 'Edit Invoices' },
      { key: 'refund_sales', label: 'Process Refunds & Returns' },
    ]
  },
  {
    module: 'Customers',
    permissions: [
      { key: 'view_customers', label: 'View Customers' },
      { key: 'create_customers', label: 'Add New Customers' },
      { key: 'edit_customers', label: 'Edit Customer Details' },
      { key: 'delete_customers', label: 'Delete Customers' },
    ]
  },
  {
    module: 'Products & Inventory',
    permissions: [
      { key: 'view_inventory', label: 'View Inventory & Stock' },
      { key: 'manage_inventory', label: 'Adjust Stock & Batches' },
      { key: 'manage_products', label: 'Create & Edit Products' },
      { key: 'manage_categories', label: 'Manage Product Categories' },
    ]
  },
  {
    module: 'Lab Orders',
    permissions: [
      { key: 'view_lab_orders', label: 'View Lab Orders' },
      { key: 'create_lab_orders', label: 'Create Lab Orders' },
      { key: 'edit_lab_orders', label: 'Update Lab Order Status' },
      { key: 'delete_lab_orders', label: 'Delete Lab Orders' },
    ]
  },
  {
    module: 'Reports',
    permissions: [
      { key: 'view_reports', label: 'View Financial & Sales Reports' },
      { key: 'export_reports', label: 'Export Reports (PDF/Excel)' },
    ]
  },
  {
    module: 'Users & Roles',
    permissions: [
      { key: 'view_users', label: 'View System Users' },
      { key: 'manage_users', label: 'Create & Edit Users' },
      { key: 'manage_roles', label: 'Configure Roles & Permissions' },
    ]
  },
  {
    module: 'System Settings',
    permissions: [
      { key: 'view_settings', label: 'View Company Settings' },
      { key: 'manage_settings', label: 'Modify Company Settings' },
      { key: 'manage_branches', label: 'Manage Branch Locations' },
    ]
  }
];

const ALL_PERMISSION_KEYS = MASTER_PERMISSIONS.flatMap(m => m.permissions.map(p => p.key));

// Default role configurations
const DEFAULT_ROLES = [
  {
    key: 'admin',
    name: 'Administrator',
    description: 'Full unrestricted access to all modules, financial settings, and user administration.',
    isSystem: true,
    badgeColor: 'purple',
    permissions: ALL_PERMISSION_KEYS
  },
  {
    key: 'manager',
    name: 'Branch Manager',
    description: 'Manages branch day-to-day operations, sales, staff, prescriptions, and reports.',
    isSystem: true,
    badgeColor: 'blue',
    permissions: [
      'view_dashboard', 'view_analytics',
      'view_prescriptions', 'create_prescriptions', 'edit_prescriptions',
      'view_pos', 'create_sales', 'view_invoices', 'edit_invoices',
      'view_customers', 'create_customers', 'edit_customers',
      'view_inventory', 'manage_inventory', 'manage_products', 'manage_categories',
      'view_lab_orders', 'create_lab_orders', 'edit_lab_orders',
      'view_reports', 'export_reports',
      'view_users',
      'view_settings'
    ]
  },
  {
    key: 'optometrist',
    name: 'Optometrist',
    description: 'Conducts eye examinations, issues prescriptions, and manages patient vision records.',
    isSystem: true,
    badgeColor: 'emerald',
    permissions: [
      'view_dashboard',
      'view_prescriptions', 'create_prescriptions', 'edit_prescriptions',
      'view_customers', 'create_customers', 'edit_customers',
      'view_lab_orders', 'create_lab_orders',
      'view_inventory'
    ]
  },
  {
    key: 'sales',
    name: 'Sales Executive',
    description: 'Handles customer counter inquiries, sales billing, and dispensing optical products.',
    isSystem: true,
    badgeColor: 'amber',
    permissions: [
      'view_dashboard',
      'view_pos', 'create_sales', 'view_invoices',
      'view_customers', 'create_customers',
      'view_prescriptions',
      'view_inventory',
      'view_lab_orders'
    ]
  },
  {
    key: 'staff',
    name: 'Staff Member',
    description: 'Standard support staff with basic viewing and customer assistance capabilities.',
    isSystem: true,
    badgeColor: 'slate',
    permissions: [
      'view_dashboard',
      'view_customers',
      'view_prescriptions',
      'view_inventory',
      'view_lab_orders'
    ]
  },
  {
    key: 'pharmacist',
    name: 'Pharmacist',
    description: 'Oversees lens solutions, drops, medicinal supplies, and pharmaceutical inventory.',
    isSystem: true,
    badgeColor: 'cyan',
    permissions: [
      'view_dashboard',
      'view_inventory', 'manage_inventory',
      'view_prescriptions',
      'view_customers'
    ]
  },
  {
    key: 'accountant',
    name: 'Accountant',
    description: 'Handles financial audits, invoicing reconciliations, tax reports, and ledger summaries.',
    isSystem: true,
    badgeColor: 'indigo',
    permissions: [
      'view_dashboard', 'view_analytics',
      'view_invoices',
      'view_reports', 'export_reports',
      'view_settings'
    ]
  }
];

class UserService {
  async register(userData) {
    return this.createUser(userData);
  }

  async login(identifier, password) {
    if (!identifier || !password) {
      throw new CustomError('Username/email and password are required', 400);
    }

    const user = await UserRepository.findByEmailOrUsername(identifier);
    if (!user) {
      throw new CustomError('Invalid username/email or password', 401);
    }

    if (!user.is_active) {
      throw new CustomError('User account is deactivated. Please contact your administrator.', 403);
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new CustomError('Invalid username/email or password', 401);
    }

    // Update last login
    await UserRepository.updateLastLogin(user.id);

    // Sign token
    const token = signToken({
      id: user.id,
      email: user.email,
      username: user.username,
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
    
    const companyDetails = await SettingsRepository.getCompanyDetails();
    user.companyDetails = companyDetails || null;
    
    return user;
  }

  async getAll(filters = {}) {
    const users = await UserRepository.getAll(filters);
    const summary = await UserRepository.getSummaryCounts();
    const rolesData = await this.getRolesAndPermissions();

    return {
      users: users.map(u => {
        const clean = { ...u };
        delete clean.password;
        return clean;
      }),
      summary: {
        ...summary,
        totalRoles: rolesData.roles.length
      }
    };
  }

  async createUser(userData) {
    const { fullName, name, username, email, phone, password, role, branchId, isActive } = userData;

    // Check if email already exists
    const existingEmail = await UserRepository.findByEmail(email);
    if (existingEmail) {
      throw new CustomError('A user with this email address already exists', 400);
    }

    // Check if username already exists
    if (username) {
      const existingUsername = await UserRepository.findByUsername(username);
      if (existingUsername) {
        throw new CustomError('A user with this username already exists', 400);
      }
    }

    // Validate password
    if (!password || password.length < 6) {
      throw new CustomError('Password must be at least 6 characters long', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await UserRepository.create({
      fullName: fullName || name,
      name: name || fullName,
      username: username || email.split('@')[0],
      email,
      phone: phone || null,
      password: hashedPassword,
      role: role || 'staff',
      branchId: branchId ? parseInt(branchId) : null,
      isActive: isActive !== undefined ? isActive : 1
    });

    const result = { ...newUser };
    delete result.password;
    return result;
  }

  async updateUser(id, userData) {
    const existingUser = await UserRepository.findById(id);
    if (!existingUser) {
      throw new CustomError('User not found', 404);
    }

    const { fullName, name, username, email, phone, role, branchId, isActive } = userData;

    // Check email uniqueness if modified
    if (email && email.toLowerCase() !== existingUser.email.toLowerCase()) {
      const duplicateEmail = await UserRepository.findByEmail(email);
      if (duplicateEmail && duplicateEmail.id !== parseInt(id)) {
        throw new CustomError('This email is already in use by another user', 400);
      }
    }

    // Check username uniqueness if modified
    if (username && username.toLowerCase() !== (existingUser.username || '').toLowerCase()) {
      const duplicateUsername = await UserRepository.findByUsername(username);
      if (duplicateUsername && duplicateUsername.id !== parseInt(id)) {
        throw new CustomError('This username is already taken', 400);
      }
    }

    // Check if modifying role or status of the only active admin
    if (existingUser.role === 'admin' && (role !== 'admin' || isActive === 0 || isActive === false)) {
      const adminCount = await UserRepository.countAdmins();
      if (adminCount <= 1) {
        throw new CustomError('Cannot demote or deactivate the only remaining active Administrator', 400);
      }
    }

    const updatedUser = await UserRepository.update(id, {
      fullName: fullName !== undefined ? fullName : existingUser.full_name,
      name: name !== undefined ? name : (fullName || existingUser.name),
      username: username !== undefined ? username : existingUser.username,
      email: email !== undefined ? email : existingUser.email,
      phone: phone !== undefined ? phone : existingUser.phone,
      role: role !== undefined ? role : existingUser.role,
      branchId: branchId !== undefined ? (branchId ? parseInt(branchId) : null) : existingUser.branch_id,
      isActive: isActive !== undefined ? isActive : existingUser.is_active
    });

    const result = { ...updatedUser };
    delete result.password;
    return result;
  }

  async resetPassword(id, newPassword) {
    const existingUser = await UserRepository.findById(id);
    if (!existingUser) {
      throw new CustomError('User not found', 404);
    }

    if (!newPassword || newPassword.length < 6) {
      throw new CustomError('Password must be at least 6 characters long', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await UserRepository.updatePassword(id, hashedPassword);

    return { message: 'Password updated successfully' };
  }

  async toggleStatus(id, isActive) {
    const existingUser = await UserRepository.findById(id);
    if (!existingUser) {
      throw new CustomError('User not found', 404);
    }

    if (!isActive && existingUser.role === 'admin') {
      const adminCount = await UserRepository.countAdmins();
      if (adminCount <= 1) {
        throw new CustomError('Cannot deactivate the only active Administrator', 400);
      }
    }

    const updated = await UserRepository.updateStatus(id, isActive);
    delete updated.password;
    return updated;
  }

  async deleteUser(id, currentUserId) {
    if (parseInt(id) === parseInt(currentUserId)) {
      throw new CustomError('You cannot delete your own account', 400);
    }

    const existingUser = await UserRepository.findById(id);
    if (!existingUser) {
      throw new CustomError('User not found', 404);
    }

    if (existingUser.role === 'admin') {
      const adminCount = await UserRepository.countAdmins();
      if (adminCount <= 1) {
        throw new CustomError('Cannot delete the only active Administrator', 400);
      }
    }

    await UserRepository.delete(id);
    return { message: 'User deleted successfully' };
  }

  // --- Roles & Permissions Management ---

  async getStoredRoles() {
    try {
      const [rows] = await db.query(
        "SELECT setting_value FROM settings WHERE setting_key = 'system_roles_permissions'"
      );
      if (rows.length > 0 && rows[0].setting_value) {
        return JSON.parse(rows[0].setting_value);
      }
    } catch (e) {
      console.error('Error fetching stored roles:', e);
    }
    return DEFAULT_ROLES;
  }

  async saveStoredRoles(roles) {
    const jsonVal = JSON.stringify(roles);
    const [existing] = await db.query(
      "SELECT id FROM settings WHERE setting_key = 'system_roles_permissions'"
    );

    if (existing.length > 0) {
      await db.query(
        "UPDATE settings SET setting_value = ? WHERE setting_key = 'system_roles_permissions'",
        [jsonVal]
      );
    } else {
      await db.query(
        "INSERT INTO settings (setting_key, setting_value) VALUES ('system_roles_permissions', ?)",
        [jsonVal]
      );
    }
  }

  async getRolesAndPermissions() {
    const roles = await this.getStoredRoles();
    const summary = await UserRepository.getSummaryCounts();

    const rolesWithCounts = roles.map(role => ({
      ...role,
      userCount: summary.roles[role.key] || 0
    }));

    return {
      roles: rolesWithCounts,
      permissionsCatalog: MASTER_PERMISSIONS
    };
  }

  async createRole(roleData) {
    const { name, description, permissions } = roleData;
    if (!name) {
      throw new CustomError('Role name is required', 400);
    }

    const key = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
    const roles = await this.getStoredRoles();

    if (roles.some(r => r.key === key)) {
      throw new CustomError('A role with this name already exists', 400);
    }

    const newRole = {
      key,
      name: name.trim(),
      description: description || '',
      isSystem: false,
      badgeColor: 'violet',
      permissions: Array.isArray(permissions) ? permissions : []
    };

    roles.push(newRole);
    await this.saveStoredRoles(roles);
    return newRole;
  }

  async updateRole(key, roleData) {
    const { name, description, permissions } = roleData;
    const roles = await this.getStoredRoles();
    const index = roles.findIndex(r => r.key === key);

    if (index === -1) {
      throw new CustomError('Role not found', 404);
    }

    const role = roles[index];
    if (name && !role.isSystem) {
      role.name = name.trim();
    }
    if (description !== undefined) {
      role.description = description;
    }
    if (Array.isArray(permissions)) {
      // Admin always retains all permissions
      if (role.key === 'admin') {
        role.permissions = ALL_PERMISSION_KEYS;
      } else {
        role.permissions = permissions;
      }
    }

    roles[index] = role;
    await this.saveStoredRoles(roles);
    return role;
  }

  async deleteRole(key) {
    const roles = await this.getStoredRoles();
    const role = roles.find(r => r.key === key);

    if (!role) {
      throw new CustomError('Role not found', 404);
    }

    if (role.isSystem) {
      throw new CustomError('System core roles cannot be deleted', 400);
    }

    // Check if users are currently assigned to this role
    const usersWithRole = await UserRepository.getAll({ role: key });
    if (usersWithRole.length > 0) {
      throw new CustomError(`Cannot delete role "${role.name}" because it is assigned to ${usersWithRole.length} user(s). Reassign them first.`, 400);
    }

    const filtered = roles.filter(r => r.key !== key);
    await this.saveStoredRoles(filtered);
    return { message: 'Role deleted successfully' };
  }
}

module.exports = new UserService();

