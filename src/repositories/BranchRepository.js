const db = require('../config/database');

class BranchRepository {
  async findById(id) {
    const [rows] = await db.query('SELECT * FROM branches WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findByCode(code) {
    const [rows] = await db.query('SELECT * FROM branches WHERE code = ?', [code]);
    return rows[0] || null;
  }

  async create(branch) {
    const { name, code, address, city, state, pincode, phone, email, managerId } = branch;
    const [result] = await db.query(
      `INSERT INTO branches (name, code, address, city, state, pincode, phone, email, manager_id, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [name, code, address, city, state, pincode, phone, email, managerId]
    );
    return this.findById(result.insertId);
  }

  async getAll(filters = {}) {
    let query = 'SELECT * FROM branches WHERE 1=1';
    const params = [];

    if (filters.isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.isActive ? 1 : 0);
    }

    const [rows] = await db.query(query, params);
    return rows;
  }

  async update(id, branch) {
    const { name, code, address, city, state, pincode, phone, email, managerId, isActive } = branch;
    await db.query(
      `UPDATE branches 
       SET name = ?, code = ?, address = ?, city = ?, state = ?, pincode = ?, phone = ?, email = ?, manager_id = ?, is_active = ? 
       WHERE id = ?`,
      [name, code, address, city, state, pincode, phone, email, managerId, isActive !== undefined ? (isActive ? 1 : 0) : 1, id]
    );
    return this.findById(id);
  }
}

module.exports = new BranchRepository();
