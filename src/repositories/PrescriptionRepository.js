const db = require('../config/database');

class PrescriptionRepository {
  async findById(id) {
    const [rows] = await db.query(
      `SELECT p.*, c.first_name, c.last_name, c.phone as customer_phone, u.name as optometrist_name 
       FROM prescriptions p 
       JOIN customers c ON p.customer_id = c.id 
       LEFT JOIN users u ON p.optometrist_id = u.id 
       WHERE p.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(prescription) {
    const {
      branchId, customerId, optometristId, prescriptionDate, expiryDate,
      od_sph, od_cyl, od_axis, od_add, od_prism, od_base,
      os_sph, os_cyl, os_axis, os_add, os_prism, os_base,
      pd, intermediateAdd, nearPd, fittingHeight, segmentHeight, remarks, prescriptionType
    } = prescription;

    const [result] = await db.query(
      `INSERT INTO prescriptions 
       (branch_id, customer_id, optometrist_id, prescription_date, expiry_date,
        od_sph, od_cyl, od_axis, od_add, od_prism, od_base,
        os_sph, os_cyl, os_axis, os_add, os_prism, os_base,
        pd, intermediate_add, near_pd, fitting_height, segment_height, remarks, prescription_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        branchId, customerId, optometristId || null, prescriptionDate, expiryDate || null,
        od_sph !== undefined ? od_sph : 0.00, od_cyl !== undefined ? od_cyl : 0.00, od_axis || 0, od_add !== undefined ? od_add : 0.00, od_prism !== undefined ? od_prism : 0.00, od_base || null,
        os_sph !== undefined ? os_sph : 0.00, os_cyl !== undefined ? os_cyl : 0.00, os_axis || 0, os_add !== undefined ? os_add : 0.00, os_prism !== undefined ? os_prism : 0.00, os_base || null,
        pd || 62.00, intermediateAdd !== undefined ? intermediateAdd : 0.00, nearPd !== undefined ? nearPd : 0.00, fittingHeight !== undefined ? fittingHeight : null, segmentHeight !== undefined ? segmentHeight : null, remarks || null, prescriptionType || 'single'
      ]
    );

    return this.findById(result.insertId);
  }

  async update(id, prescription) {
    const {
      prescriptionDate, expiryDate,
      od_sph, od_cyl, od_axis, od_add, od_prism, od_base,
      os_sph, os_cyl, os_axis, os_add, os_prism, os_base,
      pd, intermediateAdd, nearPd, fittingHeight, segmentHeight, remarks, prescriptionType
    } = prescription;

    await db.query(
      `UPDATE prescriptions 
       SET prescription_date = ?, expiry_date = ?,
           od_sph = ?, od_cyl = ?, od_axis = ?, od_add = ?, od_prism = ?, od_base = ?,
           os_sph = ?, os_cyl = ?, os_axis = ?, os_add = ?, os_prism = ?, os_base = ?,
           pd = ?, intermediate_add = ?, near_pd = ?, fitting_height = ?, segment_height = ?, remarks = ?, prescription_type = ? 
       WHERE id = ?`,
      [
        prescriptionDate, expiryDate || null,
        od_sph, od_cyl, od_axis, od_add, od_prism, od_base,
        os_sph, os_cyl, os_axis, os_add, os_prism, os_base,
        pd, intermediateAdd, nearPd, fittingHeight !== undefined ? fittingHeight : null, segmentHeight !== undefined ? segmentHeight : null, remarks, prescriptionType, id
      ]
    );

    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM prescriptions WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async getAll(filters = {}) {
    const { branchId, customerId, search, limit = 10, offset = 0 } = filters;
    let query = `
      SELECT p.*, c.first_name, c.last_name, c.phone as customer_phone, u.name as optometrist_name 
      FROM prescriptions p 
      JOIN customers c ON p.customer_id = c.id 
      LEFT JOIN users u ON p.optometrist_id = u.id 
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM prescriptions p JOIN customers c ON p.customer_id = c.id WHERE 1=1';

    const params = [];
    const countParams = [];

    if (branchId) {
      query += ' AND p.branch_id = ?';
      countQuery += ' AND p.branch_id = ?';
      params.push(branchId);
      countParams.push(branchId);
    }

    if (customerId) {
      query += ' AND p.customer_id = ?';
      countQuery += ' AND p.customer_id = ?';
      params.push(customerId);
      countParams.push(customerId);
    }

    if (search) {
      const searchPattern = `%${search}%`;
      query += ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone LIKE ?)';
      countQuery += ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone LIKE ?)';
      params.push(searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY p.prescription_date DESC, p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(query, params);
    const [countRows] = await db.query(countQuery, countParams);
    const total = countRows[0].total;

    return {
      prescriptions: rows,
      total
    };
  }
}

module.exports = new PrescriptionRepository();
