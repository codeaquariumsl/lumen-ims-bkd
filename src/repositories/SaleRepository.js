const db = require('../config/database');

class SaleRepository {
  constructor() {
    this.initSchema();
  }

  async initSchema() {
    try {
      const [cols] = await db.query("SHOW COLUMNS FROM sales");
      const colNames = cols.map((c) => c.Field);

      if (!colNames.includes('prescription_id')) {
        await db.query("ALTER TABLE sales ADD COLUMN prescription_id INT NULL AFTER customer_id");
      }
      if (!colNames.includes('prescription_charges')) {
        await db.query("ALTER TABLE sales ADD COLUMN prescription_charges DECIMAL(12,2) DEFAULT 0.00 AFTER net_amount");
      }
      if (!colNames.includes('advance_amount')) {
        await db.query("ALTER TABLE sales ADD COLUMN advance_amount DECIMAL(12,2) DEFAULT 0.00 AFTER prescription_charges");
      }
      if (!colNames.includes('balance_amount')) {
        await db.query("ALTER TABLE sales ADD COLUMN balance_amount DECIMAL(12,2) DEFAULT 0.00 AFTER advance_amount");
      }
      if (!colNames.includes('status')) {
        await db.query("ALTER TABLE sales ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'confirmed' AFTER payment_status");
        await db.query("UPDATE sales SET status = 'confirmed' WHERE status IS NULL OR status = ''");
      }

      const [siCols] = await db.query("SHOW COLUMNS FROM sale_items");
      const siColNames = siCols.map((c) => c.Field);
      if (!siColNames.includes('discount_amount')) {
        await db.query("ALTER TABLE sale_items ADD COLUMN discount_amount DECIMAL(12,2) DEFAULT 0.00 AFTER discount_percentage");
      }
    } catch (err) {
      console.error('Error verifying sales table schema:', err.message);
    }
  }

  async findById(id) {
    const [rows] = await db.query(
      `SELECT s.*, 
              c.first_name, c.last_name, c.phone as customer_phone, c.email as customer_email,
              u.name as staff_name,
              p.prescription_number, p.prescription_date, p.expiry_date,
              p.od_sph, p.od_cyl, p.od_axis,
              p.os_sph, p.os_cyl, p.os_axis,
              p.pd, p.fitting_height, p.segment_height, p.prescription_type
       FROM sales s 
       LEFT JOIN customers c ON s.customer_id = c.id 
       LEFT JOIN users u ON s.staff_id = u.id 
       LEFT JOIN prescriptions p ON s.prescription_id = p.id
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

      const {
        branchId, customerId, prescriptionId, staffId, invoiceNumber,
        totalAmount, taxAmount, discountAmount, netAmount,
        prescriptionCharges, advanceAmount, balanceAmount,
        paymentMethod, paymentStatus, status, notes
      } = sale;

      // 1. Insert into sales table with prescription, advance payment & status columns
      const [result] = await conn.query(
        `INSERT INTO sales 
         (branch_id, customer_id, prescription_id, staff_id, invoice_number, total_amount, tax_amount, discount_amount, net_amount, prescription_charges, advance_amount, balance_amount, payment_method, payment_status, status, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          branchId, customerId || null, prescriptionId || null, staffId, invoiceNumber,
          totalAmount, taxAmount || 0, discountAmount || 0, netAmount,
          prescriptionCharges || 0, advanceAmount || 0, balanceAmount || 0,
          paymentMethod || 'cash', paymentStatus || 'completed', status || 'confirmed', notes || null
        ]
      );
      const saleId = result.insertId;

      // 2. Insert items and decrement stock
      for (const item of items) {
        const { productId, quantity, unitPrice, taxPercentage, discountPercentage, discountAmount, lineTotal } = item;
        
        await conn.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, tax_percentage, discount_percentage, discount_amount, line_total) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [saleId, productId, quantity, unitPrice, taxPercentage, discountPercentage || 0, discountAmount || 0, lineTotal]
        );

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
    const { branchId, customerId, startDate, endDate, status, search, limit = 10, offset = 0 } = filters;
    let query = `
      SELECT s.*, 
             c.first_name, c.last_name, c.phone as customer_phone,
             u.name as staff_name,
             p.prescription_number, p.prescription_type, p.od_sph, p.od_cyl, p.od_axis, p.os_sph, p.os_cyl, p.os_axis, p.pd
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      LEFT JOIN users u ON s.staff_id = u.id 
      LEFT JOIN prescriptions p ON s.prescription_id = p.id
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      LEFT JOIN users u ON s.staff_id = u.id 
      LEFT JOIN prescriptions p ON s.prescription_id = p.id 
      WHERE 1=1
    `;
    
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

    if (status && status !== 'all') {
      query += ' AND s.status = ?';
      countQuery += ' AND s.status = ?';
      params.push(status);
      countParams.push(status);
    }

    if (search) {
      const searchPattern = `%${search}%`;
      query += ' AND (s.invoice_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR p.prescription_number LIKE ?)';
      countQuery += ' AND (s.invoice_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR p.prescription_number LIKE ?)';
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
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

  async updatePayment(id, { advanceAmount, balanceAmount, paymentStatus, paymentMethod, notes }) {
    await db.query(
      `UPDATE sales 
       SET advance_amount = ?, balance_amount = ?, payment_status = ?, payment_method = ?, notes = ?
       WHERE id = ?`,
      [advanceAmount, balanceAmount, paymentStatus, paymentMethod, notes, id]
    );
    return this.findById(id);
  }

  async cancelSale(id, { reason, staff }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Get current sale record
      const [sales] = await conn.query('SELECT * FROM sales WHERE id = ? FOR UPDATE', [id]);
      if (!sales || sales.length === 0) {
        throw new Error('Invoice not found.');
      }
      const sale = sales[0];
      if (sale.status === 'cancelled') {
        throw new Error('Invoice is already cancelled.');
      }

      // 2. Fetch all sale items to restore stock
      const [items] = await conn.query('SELECT * FROM sale_items WHERE sale_id = ?', [id]);

      // 3. Restore inventory quantity for each item
      for (const item of items) {
        const [invRows] = await conn.query(
          'SELECT id, quantity FROM inventory WHERE product_id = ? AND branch_id = ? FOR UPDATE',
          [item.product_id, sale.branch_id]
        );

        if (invRows.length > 0) {
          await conn.query(
            'UPDATE inventory SET quantity = quantity + ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
            [item.quantity, invRows[0].id]
          );
        } else {
          await conn.query(
            'INSERT INTO inventory (branch_id, product_id, quantity) VALUES (?, ?, ?)',
            [sale.branch_id, item.product_id, item.quantity]
          );
        }
      }

      // 4. Reduce customer's total_spent if linked
      if (sale.customer_id) {
        await conn.query(
          `UPDATE customers 
           SET total_spent = GREATEST(0, total_spent - ?) 
           WHERE id = ?`,
          [parseFloat(sale.net_amount || 0), sale.customer_id]
        );
      }

      // 5. Append cancel note
      const cancelDate = new Date().toLocaleString('en-IN');
      const cancelLog = `[${cancelDate}] Invoice CANCELLED by ${staff?.name || 'Staff'}${reason ? `: ${reason}` : ''}`;
      const updatedNotes = sale.notes ? `${sale.notes}\n${cancelLog}` : cancelLog;

      // 6. Update sale status to cancelled
      await conn.query(
        'UPDATE sales SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['cancelled', updatedNotes, id]
      );

      // 7. Audit log if table exists
      try {
        await conn.query(
          'INSERT INTO audit_logs (user_id, branch_id, action, entity_type, entity_id, changes) VALUES (?, ?, ?, ?, ?, ?)',
          [
            staff?.id || null,
            sale.branch_id,
            'CANCEL_SALE',
            'sales',
            String(id),
            JSON.stringify({ invoiceNumber: sale.invoice_number, netAmount: sale.net_amount, reason: reason || 'N/A' })
          ]
        );
      } catch (logErr) {
        console.warn('Audit log insert skipped:', logErr.message);
      }

      await conn.commit();
      return this.findById(id);
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}

module.exports = new SaleRepository();
