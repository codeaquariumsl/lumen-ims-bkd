const db = require('../config/database');

class SaleRepository {
  async findById(id) {
    const [rows] = await db.query(
      `SELECT s.*, c.first_name, c.last_name, u.name as staff_name 
       FROM sales s 
       LEFT JOIN customers c ON s.customer_id = c.id 
       LEFT JOIN users u ON s.staff_id = u.id 
       WHERE s.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async findItemsBySaleId(saleId) {
    const [rows] = await db.query(
      `SELECT si.*, p.name, p.code, p.category 
       FROM sale_items si 
       JOIN products p ON si.product_id = p.id 
       WHERE si.sale_id = ?`,
      [saleId]
    );
    return rows;
  }

  async createSale(sale, items) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const { branchId, customerId, staffId, invoiceNumber, totalAmount, taxAmount, discountAmount, netAmount, paymentMethod, paymentStatus, notes } = sale;

      // 1. Insert into sales table
      const [result] = await conn.query(
        `INSERT INTO sales 
         (branch_id, customer_id, staff_id, invoice_number, total_amount, tax_amount, discount_amount, net_amount, payment_method, payment_status, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [branchId, customerId || null, staffId, invoiceNumber, totalAmount, taxAmount || 0, discountAmount || 0, netAmount, paymentMethod, paymentStatus || 'completed', notes || null]
      );
      const saleId = result.insertId;

      // 2. Insert items and decrement stock
      for (const item of items) {
        const { productId, quantity, unitPrice, taxPercentage, discountPercentage, lineTotal } = item;
        
        // Insert sale item
        await conn.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, tax_percentage, discount_percentage, line_total) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [saleId, productId, quantity, unitPrice, taxPercentage, discountPercentage || 0, lineTotal]
        );

        // Decrement inventory stock
        const [invRows] = await conn.query(
          'SELECT id, quantity FROM inventory WHERE product_id = ? AND branch_id = ?',
          [productId, branchId]
        );

        if (invRows.length > 0) {
          const newQty = Math.max(0, invRows[0].quantity - quantity);
          await conn.query(
            'UPDATE inventory SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
            [newQty, invRows[0].id]
          );
        } else {
          await conn.query(
            'INSERT INTO inventory (branch_id, product_id, quantity) VALUES (?, ?, ?)',
            [branchId, productId, -quantity]
          );
        }
      }

      // 3. Update customer stats if customerId is provided
      if (customerId) {
        await conn.query(
          `UPDATE customers 
           SET total_spent = total_spent + ?, last_visit = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [netAmount, customerId]
        );
      }

      await conn.commit();
      return { id: saleId };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async getAll(filters = {}) {
    const { branchId, customerId, startDate, endDate, search, limit = 10, offset = 0 } = filters;
    let query = `
      SELECT s.*, c.first_name, c.last_name, u.name as staff_name 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      LEFT JOIN users u ON s.staff_id = u.id 
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE 1=1';
    
    const params = [];
    const countParams = [];

    if (branchId) {
      query += ' AND s.branch_id = ?';
      countQuery += ' AND s.branch_id = ?';
      params.push(branchId);
      countParams.push(branchId);
    }

    if (customerId) {
      query += ' AND s.customer_id = ?';
      countQuery += ' AND s.customer_id = ?';
      params.push(customerId);
      countParams.push(customerId);
    }

    if (startDate) {
      query += ' AND s.sale_date >= ?';
      countQuery += ' AND s.sale_date >= ?';
      params.push(startDate);
      countParams.push(startDate);
    }

    if (endDate) {
      query += ' AND s.sale_date <= ?';
      countQuery += ' AND s.sale_date <= ?';
      params.push(endDate + ' 23:59:59');
      countParams.push(endDate + ' 23:59:59');
    }

    if (search) {
      const searchPattern = `%${search}%`;
      query += ' AND (s.invoice_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)';
      countQuery += ' AND (s.invoice_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)';
      params.push(searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY s.sale_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(query, params);
    const [countRows] = await db.query(countQuery, countParams);
    const total = countRows[0].total;

    return {
      sales: rows,
      total
    };
  }

  async getInvoiceCount(branchId) {
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM sales WHERE branch_id = ?',
      [branchId]
    );
    return rows[0].count;
  }
}

module.exports = new SaleRepository();
