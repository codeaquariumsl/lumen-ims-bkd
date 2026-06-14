const db = require('../config/database');

class CustomerRepository {
  async findById(id) {
    const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findByPhone(phone) {
    const [rows] = await db.query('SELECT * FROM customers WHERE phone = ?', [phone]);
    return rows[0] || null;
  }

  async create(customer) {
    const { branchId, firstName, lastName, phone, email, dateOfBirth, gender, address, city, state, pincode, referralSource, customerType } = customer;
    const [result] = await db.query(
      `INSERT INTO customers 
       (branch_id, first_name, last_name, phone, email, date_of_birth, gender, address, city, state, pincode, referral_source, customer_type, total_spent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [branchId, firstName, lastName, phone, email, dateOfBirth || null, gender || null, address || null, city || null, state || null, pincode || null, referralSource || null, customerType || 'regular']
    );
    return this.findById(result.insertId);
  }

  async update(id, customer) {
    const { firstName, lastName, phone, email, dateOfBirth, gender, address, city, state, pincode, referralSource, customerType, totalSpent, lastVisit } = customer;
    
    await db.query(
      `UPDATE customers 
       SET first_name = ?, last_name = ?, phone = ?, email = ?, date_of_birth = ?, gender = ?, address = ?, city = ?, state = ?, pincode = ?, referral_source = ?, customer_type = ?, total_spent = ?, last_visit = ? 
       WHERE id = ?`,
      [
        firstName, 
        lastName || null, 
        phone || null, 
        email || null, 
        dateOfBirth || null, 
        gender || null, 
        address || null, 
        city || null, 
        state || null, 
        pincode || null, 
        referralSource || null, 
        customerType || 'regular', 
        totalSpent !== undefined ? totalSpent : 0.00, 
        lastVisit || null, 
        id
      ]
    );
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query('DELETE FROM customers WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async getAll(filters = {}) {
    const { search, customerType, branchId, limit = 10, offset = 0 } = filters;
    let query = 'SELECT * FROM customers WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM customers WHERE 1=1';
    const params = [];
    const countParams = [];

    if (branchId) {
      query += ' AND branch_id = ?';
      countQuery += ' AND branch_id = ?';
      params.push(branchId);
      countParams.push(branchId);
    }

    if (customerType) {
      query += ' AND customer_type = ?';
      countQuery += ' AND customer_type = ?';
      params.push(customerType);
      countParams.push(customerType);
    }

    if (search) {
      const searchPattern = `%${search}%`;
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      countQuery += ' AND (first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(query, params);
    const [countRows] = await db.query(countQuery, countParams);
    
    const total = countRows[0].total;

    return {
      customers: rows,
      total
    };
  }
}

module.exports = new CustomerRepository();
