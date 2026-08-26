const db = require('../config/database');

class ReportRepository {
  /**
   * Customer-wise sales report
   */
  async getCustomerWiseSalesReport(filters = {}) {
    const { branchId, startDate, endDate, search } = filters;
    const params = [];

    let query = `
      SELECT 
        c.id as customer_id,
        CASE 
          WHEN c.id IS NOT NULL THEN CONCAT('CUST-', LPAD(c.id, 4, '0')) 
          ELSE 'WALK-IN' 
        END as customer_code,
        COALESCE(CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')), 'Walk-in Customer') as customer_name,
        COALESCE(c.phone, 'N/A') as phone,
        COALESCE(c.email, 'N/A') as email,
        COUNT(s.id) as total_invoices,
        COALESCE(SUM(s.total_amount), 0) as gross_amount,
        COALESCE(SUM(s.discount_amount), 0) as total_discount,
        COALESCE(SUM(s.net_amount), 0) as total_net_amount,
        COALESCE(SUM(s.advance_amount), 0) as total_paid,
        COALESCE(SUM(s.balance_amount), 0) as total_balance,
        MAX(s.sale_date) as last_purchase_date
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE 1=1
    `;

    if (branchId) {
      query += ' AND s.branch_id = ?';
      params.push(branchId);
    }

    if (startDate) {
      query += ' AND s.sale_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND s.sale_date <= ?';
      params.push(endDate + ' 23:59:59');
    }

    if (search) {
      const searchPattern = `%${search}%`;
      query += ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone LIKE ? OR c.id LIKE ?)';
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += `
      GROUP BY c.id, c.first_name, c.last_name, c.phone, c.email
      ORDER BY total_net_amount DESC
    `;

    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Item-wise sales report
   */
  async getItemWiseSalesReport(filters = {}) {
    const { branchId, startDate, endDate, category, search } = filters;
    const params = [];

    let query = `
      SELECT 
        p.id as product_id,
        p.code as product_code,
        p.name as product_name,
        p.category,
        p.type,
        COALESCE(p.cost_price, 0) as cost_price,
        COALESCE(SUM(si.quantity), 0) as quantity_sold,
        COALESCE(AVG(si.unit_price), 0) as avg_unit_price,
        COALESCE(SUM(si.discount_amount), 0) as total_discount,
        COALESCE(SUM(si.line_total), 0) as total_revenue,
        COALESCE(SUM(si.quantity * p.cost_price), 0) as total_cost,
        COALESCE(SUM(si.line_total) - SUM(si.quantity * p.cost_price), 0) as gross_profit
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE 1=1
    `;

    if (branchId) {
      query += ' AND s.branch_id = ?';
      params.push(branchId);
    }

    if (startDate) {
      query += ' AND s.sale_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND s.sale_date <= ?';
      params.push(endDate + ' 23:59:59');
    }

    if (category && category !== 'all') {
      query += ' AND p.category = ?';
      params.push(category);
    }

    if (search) {
      const searchPattern = `%${search}%`;
      query += ' AND (p.name LIKE ? OR p.code LIKE ? OR p.category LIKE ?)';
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += `
      GROUP BY p.id, p.code, p.name, p.category, p.type, p.cost_price
      ORDER BY total_revenue DESC
    `;

    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Detailed Sales Transactions Summary Report
   */
  async getSalesSummaryReport(filters = {}) {
    const { branchId, startDate, endDate, paymentStatus, paymentMethod, search } = filters;
    const params = [];

    let query = `
      SELECT 
        s.id as sale_id,
        s.invoice_number,
        s.sale_date,
        s.total_amount,
        s.discount_amount,
        s.prescription_charges,
        s.net_amount,
        s.advance_amount,
        s.balance_amount,
        s.payment_method,
        s.payment_status,
        COALESCE(CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')), 'Walk-in Customer') as customer_name,
        COALESCE(c.phone, 'N/A') as customer_phone,
        COALESCE(u.name, 'Staff') as staff_name,
        COALESCE(item_stats.total_items, 0) as total_items,
        COALESCE(item_stats.total_units, 0) as total_units
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.staff_id = u.id
      LEFT JOIN (
        SELECT sale_id, COUNT(id) as total_items, SUM(quantity) as total_units
        FROM sale_items
        GROUP BY sale_id
      ) item_stats ON s.id = item_stats.sale_id
      WHERE 1=1
    `;

    if (branchId) {
      query += ' AND s.branch_id = ?';
      params.push(branchId);
    }

    if (startDate) {
      query += ' AND s.sale_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND s.sale_date <= ?';
      params.push(endDate + ' 23:59:59');
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query += ' AND s.payment_status = ?';
      params.push(paymentStatus);
    }

    if (paymentMethod && paymentMethod !== 'all') {
      query += ' AND s.payment_method = ?';
      params.push(paymentMethod);
    }

    if (search) {
      const searchPattern = `%${search}%`;
      query += ' AND (s.invoice_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone LIKE ?)';
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY s.sale_date DESC';

    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Current Stock Status & Valuation Report
   */
  async getStockSummaryReport(filters = {}) {
    const { branchId, category, search, stockStatus } = filters;
    const params = [];

    let query = `
      SELECT 
        p.id as product_id,
        p.code as product_code,
        p.barcode,
        p.name as product_name,
        p.category,
        p.subcategory,
        p.type,
        p.unit,
        p.min_stock,
        p.max_stock,
        COALESCE(p.cost_price, 0) as cost_price,
        COALESCE(p.selling_price, 0) as selling_price,
        COALESCE(inv.total_quantity, 0) as current_stock,
        (COALESCE(inv.total_quantity, 0) * COALESCE(p.cost_price, 0)) as total_cost_value,
        (COALESCE(inv.total_quantity, 0) * COALESCE(p.selling_price, 0)) as total_retail_value,
        CASE 
          WHEN COALESCE(inv.total_quantity, 0) <= 0 THEN 'OUT_OF_STOCK'
          WHEN COALESCE(inv.total_quantity, 0) <= p.min_stock THEN 'LOW_STOCK'
          WHEN COALESCE(inv.total_quantity, 0) >= p.max_stock AND p.max_stock > 0 THEN 'OVERSTOCK'
          ELSE 'IN_STOCK'
        END as stock_status
      FROM products p
      LEFT JOIN (
        SELECT product_id, SUM(quantity) as total_quantity
        FROM inventory
    `;

    if (branchId) {
      query += ' WHERE branch_id = ? GROUP BY product_id';
      params.push(branchId);
    } else {
      query += ' GROUP BY product_id';
    }

    query += `
      ) inv ON p.id = inv.product_id
      WHERE p.is_active = 1
    `;

    if (branchId) {
      query += ' AND p.branch_id = ?';
      params.push(branchId);
    }

    if (category && category !== 'all') {
      query += ' AND p.category = ?';
      params.push(category);
    }

    if (search) {
      const searchPattern = `%${search}%`;
      query += ' AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ? OR p.category LIKE ?)';
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (stockStatus && stockStatus !== 'all') {
      if (stockStatus === 'low_stock') {
        query += ' AND COALESCE(inv.total_quantity, 0) <= p.min_stock AND COALESCE(inv.total_quantity, 0) > 0';
      } else if (stockStatus === 'out_of_stock') {
        query += ' AND COALESCE(inv.total_quantity, 0) <= 0';
      } else if (stockStatus === 'in_stock') {
        query += ' AND COALESCE(inv.total_quantity, 0) > p.min_stock';
      }
    }

    query += ' ORDER BY p.category ASC, p.name ASC';

    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Low Stock & Reorder Report
   */
  async getLowStockReport(filters = {}) {
    const { branchId, category, search } = filters;
    const params = [];

    let query = `
      SELECT 
        p.id as product_id,
        p.code as product_code,
        p.name as product_name,
        p.category,
        p.min_stock,
        p.max_stock,
        COALESCE(p.cost_price, 0) as cost_price,
        COALESCE(p.selling_price, 0) as selling_price,
        COALESCE(inv.total_quantity, 0) as current_stock,
        GREATEST(0, p.min_stock - COALESCE(inv.total_quantity, 0)) as reorder_needed,
        (GREATEST(0, p.min_stock - COALESCE(inv.total_quantity, 0)) * COALESCE(p.cost_price, 0)) as estimated_reorder_cost,
        CASE 
          WHEN COALESCE(inv.total_quantity, 0) <= 0 THEN 'Critical (Out of Stock)'
          ELSE 'Low Stock'
        END as urgency
      FROM products p
      LEFT JOIN (
        SELECT product_id, SUM(quantity) as total_quantity
        FROM inventory
    `;

    if (branchId) {
      query += ' WHERE branch_id = ? GROUP BY product_id';
      params.push(branchId);
    } else {
      query += ' GROUP BY product_id';
    }

    query += `
      ) inv ON p.id = inv.product_id
      WHERE p.is_active = 1 AND p.type = 'inventory'
    `;

    if (branchId) {
      query += ' AND p.branch_id = ?';
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

    query += `
      HAVING current_stock <= p.min_stock
      ORDER BY current_stock ASC, reorder_needed DESC
    `;

    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Category-wise Stock Valuation Report
   */
  async getCategoryStockValuationReport(filters = {}) {
    const { branchId } = filters;
    const params = [];

    let query = `
      SELECT 
        COALESCE(p.category, 'Uncategorized') as category,
        COUNT(DISTINCT p.id) as total_skus,
        COALESCE(SUM(inv.total_quantity), 0) as total_units,
        COALESCE(SUM(COALESCE(inv.total_quantity, 0) * p.cost_price), 0) as total_cost_value,
        COALESCE(SUM(COALESCE(inv.total_quantity, 0) * p.selling_price), 0) as total_retail_value,
        COALESCE(SUM(COALESCE(inv.total_quantity, 0) * p.selling_price) - SUM(COALESCE(inv.total_quantity, 0) * p.cost_price), 0) as potential_profit,
        CASE 
          WHEN SUM(COALESCE(inv.total_quantity, 0) * p.selling_price) > 0 
          THEN ROUND(((SUM(COALESCE(inv.total_quantity, 0) * p.selling_price) - SUM(COALESCE(inv.total_quantity, 0) * p.cost_price)) / SUM(COALESCE(inv.total_quantity, 0) * p.selling_price)) * 100, 2)
          ELSE 0 
        END as profit_margin_percentage
      FROM products p
      LEFT JOIN (
        SELECT product_id, SUM(quantity) as total_quantity
        FROM inventory
    `;

    if (branchId) {
      query += ' WHERE branch_id = ? GROUP BY product_id';
      params.push(branchId);
    } else {
      query += ' GROUP BY product_id';
    }

    query += `
      ) inv ON p.id = inv.product_id
      WHERE p.is_active = 1 AND p.type = 'inventory'
    `;

    if (branchId) {
      query += ' AND p.branch_id = ?';
      params.push(branchId);
    }

    query += `
      GROUP BY p.category
      ORDER BY total_cost_value DESC
    `;

    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Payment type wise daily collections report
   */
  async getPaymentTypeWiseDailyCollectionsReport(filters = {}) {
    const { branchId, startDate, endDate, paymentMethod } = filters;
    const params = [];

    let query = `
      SELECT 
        DATE(s.sale_date) as collection_date,
        COUNT(s.id) as total_invoices,
        COALESCE(SUM(s.net_amount), 0) as total_net_sales,
        COALESCE(SUM(s.advance_amount), 0) as total_collected,
        COALESCE(SUM(s.balance_amount), 0) as total_balance,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(s.payment_method, 'cash')) = 'cash' THEN s.advance_amount ELSE 0 END), 0) as cash_collected,
        COALESCE(SUM(CASE WHEN LOWER(s.payment_method) = 'card' THEN s.advance_amount ELSE 0 END), 0) as card_collected,
        COALESCE(SUM(CASE WHEN LOWER(s.payment_method) IN ('upi', 'qr', 'online', 'transfer') THEN s.advance_amount ELSE 0 END), 0) as upi_collected,
        COALESCE(SUM(CASE WHEN LOWER(s.payment_method) = 'cheque' THEN s.advance_amount ELSE 0 END), 0) as cheque_collected,
        COALESCE(SUM(CASE WHEN LOWER(s.payment_method) NOT IN ('cash', 'card', 'upi', 'qr', 'online', 'transfer', 'cheque') AND s.payment_method IS NOT NULL THEN s.advance_amount ELSE 0 END), 0) as other_collected,
        COUNT(CASE WHEN LOWER(COALESCE(s.payment_method, 'cash')) = 'cash' THEN 1 END) as cash_tx_count,
        COUNT(CASE WHEN LOWER(s.payment_method) = 'card' THEN 1 END) as card_tx_count,
        COUNT(CASE WHEN LOWER(s.payment_method) IN ('upi', 'qr', 'online', 'transfer') THEN 1 END) as upi_tx_count,
        COUNT(CASE WHEN LOWER(s.payment_method) = 'cheque' THEN 1 END) as cheque_tx_count
      FROM sales s
      WHERE 1=1
    `;

    if (branchId) {
      query += ' AND s.branch_id = ?';
      params.push(branchId);
    }

    if (startDate) {
      query += ' AND s.sale_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND s.sale_date <= ?';
      params.push(endDate + ' 23:59:59');
    }

    if (paymentMethod && paymentMethod !== 'all') {
      query += ' AND LOWER(s.payment_method) = ?';
      params.push(paymentMethod.toLowerCase());
    }

    query += `
      GROUP BY DATE(s.sale_date)
      ORDER BY collection_date DESC
    `;

    const [rows] = await db.query(query, params);
    return rows;
  }
}

module.exports = new ReportRepository();
