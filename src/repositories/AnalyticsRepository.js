const db = require('../config/database');

class AnalyticsRepository {
  async getDashboardSummary(branchId) {
    const params = [];
    let salesQuery = 'SELECT COALESCE(SUM(net_amount), 0) as totalRevenue, COUNT(*) as totalSalesCount FROM sales WHERE 1=1';
    let customerQuery = 'SELECT COUNT(*) as totalCustomers FROM customers WHERE 1=1';
    let lowStockQuery = `
      SELECT COUNT(*) as lowStockCount 
      FROM inventory i 
      JOIN products p ON i.product_id = p.id 
      WHERE p.is_active = 1 AND i.quantity <= p.min_stock
    `;
    let labOrderQuery = "SELECT COUNT(*) as activeLabOrders FROM lab_orders WHERE status IN ('pending', 'in-process')";

    if (branchId) {
      salesQuery += ' AND branch_id = ?';
      customerQuery += ' AND branch_id = ?';
      lowStockQuery += ' AND i.branch_id = ?';
      labOrderQuery += ' AND branch_id = ?';
      params.push(branchId);
    }

    const [[salesResult]] = await db.query(salesQuery, params);
    const [[customerResult]] = await db.query(customerQuery, branchId ? [branchId] : []);
    const [[lowStockResult]] = await db.query(lowStockQuery, branchId ? [branchId] : []);
    const [[labOrderResult]] = await db.query(labOrderQuery, branchId ? [branchId] : []);

    return {
      totalRevenue: parseFloat(salesResult.totalRevenue),
      totalSalesCount: salesResult.totalSalesCount,
      totalCustomers: customerResult.totalCustomers,
      lowStockCount: lowStockResult.lowStockCount,
      activeLabOrders: labOrderResult.activeLabOrders
    };
  }

  async getRecentSales(branchId, limit = 5) {
    let query = `
      SELECT s.*, c.first_name, c.last_name 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      WHERE 1=1
    `;
    const params = [];

    if (branchId) {
      query += ' AND s.branch_id = ?';
      params.push(branchId);
    }

    query += ' ORDER BY s.sale_date DESC LIMIT ?';
    params.push(parseInt(limit));

    const [rows] = await db.query(query, params);
    return rows;
  }

  async getSalesTrends(branchId) {
    let query = `
      SELECT DATE_FORMAT(sale_date, '%Y-%m-%d') as name, COALESCE(SUM(net_amount), 0) as sales 
      FROM sales 
      WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `;
    const params = [];

    if (branchId) {
      query += ' AND branch_id = ?';
      params.push(branchId);
    }

    query += ' GROUP BY name ORDER BY name ASC';
    const [rows] = await db.query(query, params);
    return rows;
  }

  async getCustomerSegmentation(branchId) {
    let query = 'SELECT customer_type as name, COUNT(*) as value FROM customers WHERE 1=1';
    const params = [];

    if (branchId) {
      query += ' AND branch_id = ?';
      params.push(branchId);
    }

    query += ' GROUP BY customer_type';
    const [rows] = await db.query(query, params);
    return rows;
  }

  async getCategoryPerformance(branchId) {
    let query = `
      SELECT p.category as name, COALESCE(SUM(si.line_total), 0) as value 
      FROM sale_items si 
      JOIN products p ON si.product_id = p.id 
      JOIN sales s ON si.sale_id = s.id 
      WHERE 1=1
    `;
    const params = [];

    if (branchId) {
      query += ' AND s.branch_id = ?';
      params.push(branchId);
    }

    query += ' GROUP BY name';
    const [rows] = await db.query(query, params);
    return rows;
  }

  // NEW: Get detailed monthly metrics (last 6 months)
  async getMonthlyMetrics(branchId) {
    const params = [];
    let query = `
      SELECT 
        MONTH(s.sale_date) as monthNum,
        YEAR(s.sale_date) as yearNum,
        COALESCE(SUM(s.net_amount), 0) as revenue,
        COALESCE(SUM(si.quantity * (si.unit_price - p.cost_price)), 0) as profit
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      WHERE s.sale_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    `;
    if (branchId) {
      query += ' AND s.branch_id = ?';
      params.push(branchId);
    }
    query += ' GROUP BY YEAR(s.sale_date), MONTH(s.sale_date)';
    const [salesRows] = await db.query(query, params);

    // Get customer counts
    const custParams = [];
    let custQuery = `
      SELECT 
        MONTH(created_at) as monthNum,
        YEAR(created_at) as yearNum,
        COUNT(*) as count
      FROM customers
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    `;
    if (branchId) {
      custQuery += ' AND branch_id = ?';
      custParams.push(branchId);
    }
    custQuery += ' GROUP BY YEAR(created_at), MONTH(created_at)';
    const [custRows] = await db.query(custQuery, custParams);

    // Get prescription counts
    const presParams = [];
    let presQuery = `
      SELECT 
        MONTH(prescription_date) as monthNum,
        YEAR(prescription_date) as yearNum,
        COUNT(*) as count
      FROM prescriptions
      WHERE prescription_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    `;
    if (branchId) {
      presQuery += ' AND branch_id = ?';
      presParams.push(branchId);
    }
    presQuery += ' GROUP BY YEAR(prescription_date), MONTH(prescription_date)';
    const [presRows] = await db.query(presQuery, presParams);

    return {
      sales: salesRows,
      customers: custRows,
      prescriptions: presRows
    };
  }

  // NEW: Get weekly activity (last 7 days)
  async getWeeklyActivity(branchId) {
    const params = [];
    let query = `
      SELECT 
        DATE(sale_date) as saleDate,
        COALESCE(SUM(net_amount), 0) as sales,
        COUNT(*) as salesCount
      FROM sales
      WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    `;
    if (branchId) {
      query += ' AND branch_id = ?';
      params.push(branchId);
    }
    query += ' GROUP BY DATE(sale_date)';
    const [rows] = await db.query(query, params);
    return rows;
  }

  // NEW: Get customer scatter coordinates
  async getCustomerSegmentationDetails(branchId) {
    const params = [];
    let query = `
      SELECT 
        c.customer_type as segment,
        COUNT(DISTINCT c.id) as value,
        COALESCE(AVG(sales_cnt.cnt), 0) as x,
        COALESCE(AVG(c.total_spent), 0) as y
      FROM customers c
      LEFT JOIN (
        SELECT customer_id, COUNT(*) as cnt 
        FROM sales 
        GROUP BY customer_id
      ) sales_cnt ON c.id = sales_cnt.customer_id
      WHERE 1=1
    `;
    if (branchId) {
      query += ' AND c.branch_id = ?';
      params.push(branchId);
    }
    query += ' GROUP BY c.customer_type';
    const [rows] = await db.query(query, params);
    return rows;
  }

  // NEW: Get repeat rate, lifetimes, etc.
  async getSummaryStats(branchId) {
    const params = [];
    let query = `
      SELECT 
        COUNT(DISTINCT CASE WHEN sales_cnt > 1 THEN customer_id END) as repeatCustomers,
        COUNT(DISTINCT customer_id) as totalCustomersWithSales
      FROM (
        SELECT customer_id, COUNT(*) as sales_cnt 
        FROM sales 
        WHERE customer_id IS NOT NULL
    `;
    if (branchId) {
      query += ' AND branch_id = ?';
      params.push(branchId);
    }
    query += ' GROUP BY customer_id) sub';
    const [repeatRows] = await db.query(query, params);

    const clvParams = [];
    let clvQuery = 'SELECT COALESCE(AVG(total_spent), 0) as clv FROM customers WHERE total_spent > 0';
    if (branchId) {
      clvQuery += ' AND branch_id = ?';
      clvParams.push(branchId);
    }
    const [clvRows] = await db.query(clvQuery, clvParams);

    const repeatCustomers = repeatRows[0]?.repeatCustomers || 0;
    const totalCustomersWithSales = repeatRows[0]?.totalCustomersWithSales || 0;

    return {
      repeatRate: totalCustomersWithSales > 0 ? (repeatCustomers / totalCustomersWithSales) * 100 : 0,
      clv: parseFloat(clvRows[0]?.clv || 0)
    };
  }
}

module.exports = new AnalyticsRepository();
