const db = require('../config/database');

class UserRepository {
  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  async findByUsername(username) {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
  }

  async findByEmailOrUsername(identifier) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [identifier, identifier]
    );
    return rows[0] || null;
  }

  async findById(id) {
    const [rows] = await db.query(
      `SELECT u.id, u.full_name, u.name, u.username, u.email, u.phone, 
              u.role, u.branch_id, u.is_active, u.last_login, u.created_at, u.updated_at,
              b.name as branch_name, b.code as branch_code 
       FROM users u 
       LEFT JOIN branches b ON u.branch_id = b.id 
       WHERE u.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(user) {
    const {
      fullName,
      name,
      username,
      email,
      phone,
      password,
      role,
      branchId,
      isActive
    } = user;

    const actualFullName = fullName || name;
    const actualName = name || fullName;

    const [result] = await db.query(
      `INSERT INTO users (full_name, name, username, email, phone, password, role, branch_id, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        actualFullName,
        actualName,
        username || null,
        email,
        phone || null,
        password,
        role || 'staff',
        branchId || null,
        isActive !== undefined ? (isActive ? 1 : 0) : 1
      ]
    );
    return this.findById(result.insertId);
  }

  async update(id, userData) {
    const {
      fullName,
      name,
      username,
      email,
      phone,
      role,
      branchId,
      isActive
    } = userData;

    const actualFullName = fullName || name;
    const actualName = name || fullName;

    await db.query(
      `UPDATE users 
       SET full_name = ?, 
           name = ?, 
           username = ?, 
           email = ?, 
           phone = ?, 
           role = ?, 
           branch_id = ?, 
           is_active = ? 
       WHERE id = ?`,
      [
        actualFullName,
        actualName,
        username || null,
        email,
        phone || null,
        role,
        branchId || null,
        isActive !== undefined ? (isActive ? 1 : 0) : 1,
        id
      ]
    );

    return this.findById(id);
  }

  async updatePassword(id, hashedPassword) {
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
  }

  async updateStatus(id, isActive) {
    await db.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
    return this.findById(id);
  }

  async delete(id) {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
  }

  async countAdmins() {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = 1"
    );
    return rows[0]?.count || 0;
  }

  async updateLastLogin(id) {
    await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  }

  async getAll(filters = {}) {
    let query = `
      SELECT u.id, u.full_name, u.name, u.username, u.email, u.phone, 
             u.role, u.branch_id, u.is_active, u.last_login, u.created_at, u.updated_at,
             b.name as branch_name, b.code as branch_code 
      FROM users u 
      LEFT JOIN branches b ON u.branch_id = b.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query += ` AND (u.full_name LIKE ? OR u.name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters.branchId) {
      query += ' AND u.branch_id = ?';
      params.push(filters.branchId);
    }

    if (filters.role) {
      query += ' AND u.role = ?';
      params.push(filters.role);
    }

    if (filters.status !== undefined && filters.status !== '' && filters.status !== 'all') {
      const isActive = filters.status === 'active' || filters.status === '1' || filters.status === 1;
      query += ' AND u.is_active = ?';
      params.push(isActive ? 1 : 0);
    }

    query += ' ORDER BY u.id ASC';

    const [rows] = await db.query(query, params);
    return rows;
  }

  async getSummaryCounts() {
    const [totalRows] = await db.query('SELECT COUNT(*) as total FROM users');
    const [activeRows] = await db.query('SELECT COUNT(*) as active FROM users WHERE is_active = 1');
    const [inactiveRows] = await db.query('SELECT COUNT(*) as inactive FROM users WHERE is_active = 0');
    const [roleRows] = await db.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');

    return {
      total: totalRows[0]?.total || 0,
      active: activeRows[0]?.active || 0,
      inactive: inactiveRows[0]?.inactive || 0,
      roles: roleRows.reduce((acc, curr) => {
        acc[curr.role] = curr.count;
        return acc;
      }, {})
    };
  }
}

module.exports = new UserRepository();
