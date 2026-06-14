const db = require('../config/database');

class UserRepository {
  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  async findById(id) {
    const [rows] = await db.query(
      `SELECT u.*, b.name as branch_name 
       FROM users u 
       LEFT JOIN branches b ON u.branch_id = b.id 
       WHERE u.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(user) {
    const { name, email, password, role, branchId, isActive } = user;
    const [result] = await db.query(
      `INSERT INTO users (name, email, password, role, branch_id, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, password, role, branchId, isActive !== undefined ? isActive : 1]
    );
    return this.findById(result.insertId);
  }

  async updateLastLogin(id) {
    await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  }

  async getAll(filters = {}) {
    let query = 'SELECT id, name, email, role, branch_id, is_active, last_login, created_at FROM users WHERE 1=1';
    const params = [];

    if (filters.branchId) {
      query += ' AND branch_id = ?';
      params.push(filters.branchId);
    }
    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }

    const [rows] = await db.query(query, params);
    return rows;
  }
}

module.exports = new UserRepository();
