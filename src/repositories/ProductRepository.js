const db = require('../config/database');

class ProductRepository {
  async findById(id) {
    const [rows] = await db.query(
      `SELECT p.*, COALESCE(SUM(i.quantity), 0) as quantity 
       FROM products p 
       LEFT JOIN inventory i ON p.id = i.product_id 
       WHERE p.id = ? 
       GROUP BY p.id`,
      [id]
    );
    return rows[0] || null;
  }

  async findByCode(code, branchId) {
    const [rows] = await db.query(
      'SELECT * FROM products WHERE code = ? AND branch_id = ? AND is_active = 1',
      [code, branchId]
    );
    return rows[0] || null;
  }

  async create(product, initialQuantity = 0) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const { branchId, code, name, category, subcategory, description, manufacturer, costPrice, sellingPrice, discountPercentage, hsnCode, taxPercentage, barcode, unit, minStock, maxStock } = product;
      
      const [result] = await conn.query(
        `INSERT INTO products 
         (branch_id, code, name, category, subcategory, description, manufacturer, cost_price, selling_price, discount_percentage, hsn_code, tax_percentage, barcode, unit, min_stock, max_stock, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [branchId, code, name, category, subcategory || null, description || null, manufacturer || null, costPrice, sellingPrice, discountPercentage || 0, hsnCode || null, taxPercentage || 0, barcode || null, unit || 'pcs', minStock || 5, maxStock || 100]
      );
      const prodId = result.insertId;

      // Create initial inventory record
      await conn.query(
        `INSERT INTO inventory (branch_id, product_id, quantity) 
         VALUES (?, ?, ?)`,
        [branchId, prodId, initialQuantity]
      );

      await conn.commit();
      
      // Fetch and return the newly created product
      const [newRows] = await conn.query(
        `SELECT p.*, COALESCE(i.quantity, 0) as quantity 
         FROM products p 
         LEFT JOIN inventory i ON p.id = i.product_id 
         WHERE p.id = ?
         GROUP BY p.id`,
        [prodId]
      );
      return newRows[0];
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async update(id, product) {
    const { code, name, category, subcategory, description, manufacturer, costPrice, sellingPrice, discountPercentage, hsnCode, taxPercentage, barcode, unit, minStock, maxStock, isActive } = product;
    
    await db.query(
      `UPDATE products 
       SET code = ?, name = ?, category = ?, subcategory = ?, description = ?, manufacturer = ?, cost_price = ?, selling_price = ?, discount_percentage = ?, hsn_code = ?, tax_percentage = ?, barcode = ?, unit = ?, min_stock = ?, max_stock = ?, is_active = ? 
       WHERE id = ?`,
      [
        code, name, category, subcategory || null, description || null, manufacturer || null, 
        costPrice, sellingPrice, discountPercentage || 0.00, hsnCode || null, taxPercentage || 0.00, 
        barcode || null, unit || 'pcs', minStock || 5, maxStock || 100, isActive !== undefined ? (isActive ? 1 : 0) : 1, id
      ]
    );

    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async getAll(filters = {}) {
    const { search, category, branchId, limit = 10, offset = 0 } = filters;
    let query = `
      SELECT p.*, COALESCE(SUM(i.quantity), 0) as quantity 
      FROM products p 
      LEFT JOIN inventory i ON p.id = i.product_id 
      WHERE p.is_active = 1
    `;
    let countQuery = 'SELECT COUNT(DISTINCT p.id) as total FROM products p WHERE p.is_active = 1';
    
    const params = [];
    const countParams = [];

    if (branchId) {
      query += ' AND p.branch_id = ?';
      countQuery += ' AND p.branch_id = ?';
      params.push(branchId);
      countParams.push(branchId);
    }

    if (category && category !== 'all') {
      query += ' AND p.category = ?';
      countQuery += ' AND p.category = ?';
      params.push(category);
      countParams.push(category);
    }

    if (search) {
      const searchPattern = `%${search}%`;
      query += ' AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ?)';
      countQuery += ' AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ?)';
      params.push(searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(query, params);
    const [countRows] = await db.query(countQuery, countParams);
    
    const total = countRows[0].total;

    return {
      products: rows,
      total
    };
  }

  // Inventory Status queries
  async getInventoryStatus(filters = {}) {
    const { branchId, category, search } = filters;
    let query = `
      SELECT i.id as inventory_id, i.quantity, i.batch_number, i.serial_number, i.expiry_date, i.last_updated,
             p.id as product_id, p.code, p.name, p.category, p.min_stock, p.max_stock, p.cost_price, p.selling_price
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE p.is_active = 1
    `;
    const params = [];

    if (branchId) {
      query += ' AND i.branch_id = ?';
      params.push(branchId);
    }

    if (category && category !== 'all') {
      query += ' AND p.category = ?';
      params.push(category);
    }

    if (search) {
      const searchPattern = `%${search}%`;
      query += ' AND (p.name LIKE ? OR p.code LIKE ?)';
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY p.name ASC';
    const [rows] = await db.query(query, params);
    return rows;
  }

  async updateInventoryQuantity(productId, branchId, quantityChange) {
    const [rows] = await db.query(
      'SELECT * FROM inventory WHERE product_id = ? AND branch_id = ?',
      [productId, branchId]
    );

    if (rows.length > 0) {
      await db.query(
        'UPDATE inventory SET quantity = quantity + ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
        [quantityChange, rows[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO inventory (branch_id, product_id, quantity) VALUES (?, ?, ?)',
        [branchId, productId, quantityChange]
      );
    }
  }

  async setInventoryDetails(productId, branchId, details) {
    const { quantity, batchNumber, serialNumber, expiryDate } = details;
    const [rows] = await db.query(
      'SELECT * FROM inventory WHERE product_id = ? AND branch_id = ?',
      [productId, branchId]
    );

    if (rows.length > 0) {
      await db.query(
        `UPDATE inventory 
         SET quantity = ?, batch_number = ?, serial_number = ?, expiry_date = ?, last_updated = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [quantity, batchNumber || null, serialNumber || null, expiryDate || null, rows[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO inventory (branch_id, product_id, quantity, batch_number, serial_number, expiry_date) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [branchId, productId, quantity, batchNumber || null, serialNumber || null, expiryDate || null]
      );
    }
  }
}

module.exports = new ProductRepository();
