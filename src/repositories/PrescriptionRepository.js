const db = require('../config/database');

class PrescriptionRepository {
  constructor() {
    this.initSchema();
  }

  async initSchema() {
    try {
      const [cols] = await db.query("SHOW COLUMNS FROM prescriptions");
      const colNames = cols.map((c) => c.Field);

      const columnsToAdd = [
        { name: 'od_va', type: "VARCHAR(20) DEFAULT '6/6'" },
        { name: 'os_va', type: "VARCHAR(20) DEFAULT '6/6'" },
        { name: 'od_add', type: "DECIMAL(5,2) DEFAULT 0.00" },
        { name: 'os_add', type: "DECIMAL(5,2) DEFAULT 0.00" },
        { name: 'pd_right', type: "DECIMAL(5,2) NULL" },
        { name: 'pd_left', type: "DECIMAL(5,2) NULL" },
        { name: 'pd_near', type: "DECIMAL(5,2) NULL" },
        { name: 'pd_near_right', type: "DECIMAL(5,2) NULL" },
        { name: 'pd_near_left', type: "DECIMAL(5,2) NULL" },
        { name: 'fh_right', type: "DECIMAL(5,2) NULL" },
        { name: 'fh_left', type: "DECIMAL(5,2) NULL" },
        { name: 'sh_right', type: "DECIMAL(5,2) NULL" },
        { name: 'sh_left', type: "DECIMAL(5,2) NULL" },
        { name: 'a_val', type: "VARCHAR(20) NULL" },
        { name: 'b_val', type: "VARCHAR(20) NULL" },
        { name: 'dbl_val', type: "VARCHAR(20) NULL" },
        { name: 'dia_right', type: "VARCHAR(20) NULL" },
        { name: 'dia_left', type: "VARCHAR(20) NULL" },
        { name: 'base_curve_right', type: "VARCHAR(20) NULL" },
        { name: 'base_curve_left', type: "VARCHAR(20) NULL" },
        { name: 'panto_angle', type: "VARCHAR(20) NULL" },
        { name: 'wrap_angle', type: "VARCHAR(20) NULL" }
      ];

      for (const col of columnsToAdd) {
        if (!colNames.includes(col.name)) {
          await db.query(`ALTER TABLE prescriptions ADD COLUMN ${col.name} ${col.type}`);
        }
      }
    } catch (err) {
      console.error('Error verifying prescriptions table schema:', err.message);
    }
  }

  async generateNextPrescriptionNumber(dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    const yy = d.getFullYear().toString().slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const prefix = `${yy}${mm}`; // e.g. "2607"

    const [rows] = await db.query(
      `SELECT prescription_number FROM prescriptions 
       WHERE prescription_number LIKE ? 
       ORDER BY prescription_number DESC LIMIT 1`,
      [`${prefix}%`]
    );

    let nextSeq = 1;
    if (rows.length > 0 && rows[0].prescription_number) {
      const lastNum = String(rows[0].prescription_number);
      const seqPart = lastNum.slice(4); // digits after YYMM
      const parsed = parseInt(seqPart, 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }

    const seqStr = String(nextSeq).padStart(4, '0');
    return `${prefix}${seqStr}`; // e.g. "26070001"
  }

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
      od_sph, od_cyl, od_axis, od_add, od_va, od_prism, od_base,
      os_sph, os_cyl, os_axis, os_add, os_va, os_prism, os_base,
      pd, pd_right, pd_left, pd_near, pd_near_right, pd_near_left,
      intermediateAdd, nearPd, fittingHeight, segmentHeight, fh_right, fh_left, sh_right, sh_left,
      a_val, b_val, dbl_val, dia_right, dia_left, base_curve_right, base_curve_left, panto_angle, wrap_angle,
      remarks, prescriptionType
    } = prescription;

    const prescriptionNumber = prescription.prescriptionNumber || await this.generateNextPrescriptionNumber(prescriptionDate);

    const [result] = await db.query(
      `INSERT INTO prescriptions 
       (prescription_number, branch_id, customer_id, optometrist_id, prescription_date, expiry_date,
        od_sph, od_cyl, od_axis, od_add, od_va, od_prism, od_base,
        os_sph, os_cyl, os_axis, os_add, os_va, os_prism, os_base,
        pd, pd_right, pd_left, pd_near, pd_near_right, pd_near_left,
        intermediate_add, near_pd, fitting_height, segment_height, fh_right, fh_left, sh_right, sh_left,
        a_val, b_val, dbl_val, dia_right, dia_left, base_curve_right, base_curve_left, panto_angle, wrap_angle,
        remarks, prescription_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        prescriptionNumber, branchId, customerId, optometristId || null, prescriptionDate, expiryDate || null,
        od_sph !== undefined ? od_sph : 0.00, od_cyl !== undefined ? od_cyl : 0.00, od_axis || 0, od_add !== undefined ? od_add : 0.00, od_va || '6/6', od_prism !== undefined ? od_prism : 0.00, od_base || null,
        os_sph !== undefined ? os_sph : 0.00, os_cyl !== undefined ? os_cyl : 0.00, os_axis || 0, os_add !== undefined ? os_add : 0.00, os_va || '6/6', os_prism !== undefined ? os_prism : 0.00, os_base || null,
        pd || 62.00, pd_right !== undefined ? pd_right : null, pd_left !== undefined ? pd_left : null, pd_near !== undefined ? pd_near : null, pd_near_right !== undefined ? pd_near_right : null, pd_near_left !== undefined ? pd_near_left : null,
        intermediateAdd !== undefined ? intermediateAdd : 0.00, nearPd !== undefined ? nearPd : 0.00, fittingHeight !== undefined ? fittingHeight : null, segmentHeight !== undefined ? segmentHeight : null, fh_right !== undefined ? fh_right : null, fh_left !== undefined ? fh_left : null, sh_right !== undefined ? sh_right : null, sh_left !== undefined ? sh_left : null,
        a_val || null, b_val || null, dbl_val || null, dia_right || null, dia_left || null, base_curve_right || null, base_curve_left || null, panto_angle || null, wrap_angle || null,
        remarks || null, prescriptionType || 'single'
      ]
    );

    return this.findById(result.insertId);
  }

  async update(id, prescription) {
    const {
      prescriptionDate, expiryDate,
      od_sph, od_cyl, od_axis, od_add, od_va, od_prism, od_base,
      os_sph, os_cyl, os_axis, os_add, os_va, os_prism, os_base,
      pd, pd_right, pd_left, pd_near, pd_near_right, pd_near_left,
      intermediateAdd, nearPd, fittingHeight, segmentHeight, fh_right, fh_left, sh_right, sh_left,
      a_val, b_val, dbl_val, dia_right, dia_left, base_curve_right, base_curve_left, panto_angle, wrap_angle,
      remarks, prescriptionType
    } = prescription;

    await db.query(
      `UPDATE prescriptions 
       SET prescription_date = ?, expiry_date = ?,
           od_sph = ?, od_cyl = ?, od_axis = ?, od_add = ?, od_va = ?, od_prism = ?, od_base = ?,
           os_sph = ?, os_cyl = ?, os_axis = ?, os_add = ?, os_va = ?, os_prism = ?, os_base = ?,
           pd = ?, pd_right = ?, pd_left = ?, pd_near = ?, pd_near_right = ?, pd_near_left = ?,
           intermediate_add = ?, near_pd = ?, fitting_height = ?, segment_height = ?, fh_right = ?, fh_left = ?, sh_right = ?, sh_left = ?,
           a_val = ?, b_val = ?, dbl_val = ?, dia_right = ?, dia_left = ?, base_curve_right = ?, base_curve_left = ?, panto_angle = ?, wrap_angle = ?,
           remarks = ?, prescription_type = ? 
       WHERE id = ?`,
      [
        prescriptionDate, expiryDate || null,
        od_sph, od_cyl, od_axis, od_add, od_va || '6/6', od_prism, od_base,
        os_sph, os_cyl, os_axis, os_add, os_va || '6/6', os_prism, os_base,
        pd, pd_right !== undefined ? pd_right : null, pd_left !== undefined ? pd_left : null, pd_near !== undefined ? pd_near : null, pd_near_right !== undefined ? pd_near_right : null, pd_near_left !== undefined ? pd_near_left : null,
        intermediateAdd, nearPd, fittingHeight !== undefined ? fittingHeight : null, segmentHeight !== undefined ? segmentHeight : null, fh_right !== undefined ? fh_right : null, fh_left !== undefined ? fh_left : null, sh_right !== undefined ? sh_right : null, sh_left !== undefined ? sh_left : null,
        a_val || null, b_val || null, dbl_val || null, dia_right || null, dia_left || null, base_curve_right || null, base_curve_left || null, panto_angle || null, wrap_angle || null,
        remarks, prescriptionType, id
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
      query += ' AND (p.prescription_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone LIKE ?)';
      countQuery += ' AND (p.prescription_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone LIKE ?)';
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
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
