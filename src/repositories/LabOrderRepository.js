const db = require('../config/database');

class LabOrderRepository {
  async findById(id) {
    const [rows] = await db.query(
      `SELECT lo.*, c.first_name, c.last_name, c.phone as customer_phone 
       FROM lab_orders lo 
       JOIN customers c ON lo.customer_id = c.id 
       WHERE lo.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async findByOrderNumber(orderNumber) {
    const [rows] = await db.query(
      'SELECT * FROM lab_orders WHERE order_number = ?',
      [orderNumber]
    );
    return rows[0] || null;
  }

  async create(order) {
    const { branchId, customerId, prescriptionId, saleId, orderNumber, frameCode, lensType, coating, tintingColor, deliveryDate, status, totalCost, labNotes } = order;
    const [result] = await db.query(
      `INSERT INTO lab_orders 
       (branch_id, customer_id, prescription_id, sale_id, order_number, frame_code, lens_type, coating, tinting_color, delivery_date, status, total_cost, lab_notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        branchId, customerId, prescriptionId || null, saleId || null, orderNumber, 
        frameCode || null, lensType || null, coating || null, tintingColor || null, 
        deliveryDate || null, status || 'pending', totalCost || 0.00, labNotes || null
      ]
    );
    return this.findById(result.insertId);
  }

  async update(id, order) {
    const { frameCode, lensType, coating, tintingColor, deliveryDate, status, totalCost, labNotes } = order;
    await db.query(
      `UPDATE lab_orders 
       SET frame_code = ?, lens_type = ?, coating = ?, tinting_color = ?, delivery_date = ?, status = ?, total_cost = ?, lab_notes = ? 
       WHERE id = ?`,
      [frameCode, lensType, coating, tintingColor, deliveryDate, status, totalCost, labNotes, id]
    );
    return this.findById(id);
  }

  async updateStatus(id, status) {
    await db.query('UPDATE lab_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM lab_orders WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async getAll(filters = {}) {
    const { branchId, status, search, limit = 10, offset = 0 } = filters;
    let query = `
      SELECT lo.*, c.first_name, c.last_name, c.phone as customer_phone 
      FROM lab_orders lo 
      JOIN customers c ON lo.customer_id = c.id 
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM lab_orders lo JOIN customers c ON lo.customer_id = c.id WHERE 1=1';

    const params = [];
    const countParams = [];

    if (branchId) {
      query += ' AND lo.branch_id = ?';
      countQuery += ' AND lo.branch_id = ?';
      params.push(branchId);
      countParams.push(branchId);
    }

    if (status && status !== 'all') {
      query += ' AND lo.status = ?';
      countQuery += ' AND lo.status = ?';
      params.push(status);
      countParams.push(status);
    }

    if (search) {
      const searchPattern = `%${search}%`;
      query += ' AND (lo.order_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone LIKE ?)';
      countQuery += ' AND (lo.order_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone LIKE ?)';
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY lo.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(query, params);
    const [countRows] = await db.query(countQuery, countParams);
    const total = countRows[0].total;

    return {
      orders: rows,
      total
    };
  }

  async getLabOrderCount(branchId) {
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM lab_orders WHERE branch_id = ?',
      [branchId]
    );
    return rows[0].count;
  }
}

module.exports = new LabOrderRepository();
