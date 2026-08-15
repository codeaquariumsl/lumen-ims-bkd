const db = require('../config/database');

class CategoryRepository {
  async findAll() {
    const [rows] = await db.query(
      `SELECT c.*, COUNT(p.id) as item_count 
       FROM categories c 
       LEFT JOIN products p ON LOWER(c.name) = LOWER(p.category) AND p.is_active = 1
       GROUP BY c.id 
       ORDER BY c.name ASC`
    );
    return rows;
  }

  async findByName(name) {
    const [rows] = await db.query(
      'SELECT * FROM categories WHERE LOWER(name) = LOWER(?)',
      [name.trim()]
    );
    return rows[0] || null;
  }

  async findByCode(code) {
    if (!code) return null;
    const [rows] = await db.query(
      'SELECT * FROM categories WHERE UPPER(code) = UPPER(?)',
      [code.trim()]
    );
    return rows[0] || null;
  }

  async findById(id) {
    const [rows] = await db.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const { name, code, description } = data;
    const [result] = await db.query(
      'INSERT INTO categories (name, code, description) VALUES (?, ?, ?)',
      [name.trim().toLowerCase(), code ? code.trim().toUpperCase() : null, description || null]
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    const { name, code, description } = data;
    await db.query(
      'UPDATE categories SET name = ?, code = ?, description = ? WHERE id = ?',
      [name.trim().toLowerCase(), code ? code.trim().toUpperCase() : null, description || null, id]
    );
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query(
      'DELETE FROM categories WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  async getProductUsageCount(categoryName) {
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM products WHERE LOWER(category) = LOWER(?) AND is_active = 1',
      [categoryName.trim()]
    );
    return rows[0]?.count || 0;
  }
}

module.exports = new CategoryRepository();
