const ReportRepository = require('../repositories/ReportRepository');

class ReportService {
  /**
   * Customer-wise Sales Report with calculated summary KPIs
   */
  async getCustomerWiseSales(filters) {
    const data = await ReportRepository.getCustomerWiseSalesReport(filters);

    const totalCustomers = data.length;
    const totalInvoices = data.reduce((sum, row) => sum + parseInt(row.total_invoices || 0), 0);
    const totalSalesAmount = data.reduce((sum, row) => sum + parseFloat(row.total_net_amount || 0), 0);
    const totalPaidAmount = data.reduce((sum, row) => sum + parseFloat(row.total_paid || 0), 0);
    const totalBalanceAmount = data.reduce((sum, row) => sum + parseFloat(row.total_balance || 0), 0);
    const avgCustomerSpend = totalCustomers > 0 ? totalSalesAmount / totalCustomers : 0;

    return {
      summary: {
        totalCustomers,
        totalInvoices,
        totalSalesAmount,
        totalPaidAmount,
        totalBalanceAmount,
        avgCustomerSpend
      },
      records: data
    };
  }

  /**
   * Item-wise Sales Report with calculated summary KPIs
   */
  async getItemWiseSales(filters) {
    const data = await ReportRepository.getItemWiseSalesReport(filters);

    const totalUniqueItems = data.length;
    const totalQuantitySold = data.reduce((sum, row) => sum + parseInt(row.quantity_sold || 0), 0);
    const totalRevenue = data.reduce((sum, row) => sum + parseFloat(row.total_revenue || 0), 0);
    const totalCost = data.reduce((sum, row) => sum + parseFloat(row.total_cost || 0), 0);
    const totalGrossProfit = data.reduce((sum, row) => sum + parseFloat(row.gross_profit || 0), 0);
    const overallMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

    return {
      summary: {
        totalUniqueItems,
        totalQuantitySold,
        totalRevenue,
        totalCost,
        totalGrossProfit,
        overallMargin
      },
      records: data
    };
  }

  /**
   * Sales Transactions Summary Report
   */
  async getSalesSummary(filters) {
    const data = await ReportRepository.getSalesSummaryReport(filters);

    const totalOrders = data.length;
    const totalGross = data.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0);
    const totalDiscount = data.reduce((sum, row) => sum + parseFloat(row.discount_amount || 0), 0);
    const totalNetSales = data.reduce((sum, row) => sum + parseFloat(row.net_amount || 0), 0);
    const totalCollected = data.reduce((sum, row) => sum + parseFloat(row.advance_amount || 0), 0);
    const totalOutstanding = data.reduce((sum, row) => sum + parseFloat(row.balance_amount || 0), 0);
    const totalUnitsSold = data.reduce((sum, row) => sum + parseInt(row.total_units || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalNetSales / totalOrders : 0;

    return {
      summary: {
        totalOrders,
        totalGross,
        totalDiscount,
        totalNetSales,
        totalCollected,
        totalOutstanding,
        totalUnitsSold,
        avgOrderValue
      },
      records: data
    };
  }

  /**
   * Current Stock Levels & Valuation
   */
  async getStockSummary(filters) {
    const data = await ReportRepository.getStockSummaryReport(filters);

    const totalProducts = data.length;
    const totalUnits = data.reduce((sum, row) => sum + parseInt(row.current_stock || 0), 0);
    const totalCostValue = data.reduce((sum, row) => sum + parseFloat(row.total_cost_value || 0), 0);
    const totalRetailValue = data.reduce((sum, row) => sum + parseFloat(row.total_retail_value || 0), 0);
    const potentialProfit = totalRetailValue - totalCostValue;
    const averageMargin = totalRetailValue > 0 ? (potentialProfit / totalRetailValue) * 100 : 0;

    const lowStockCount = data.filter(row => row.stock_status === 'LOW_STOCK').length;
    const outOfStockCount = data.filter(row => row.stock_status === 'OUT_OF_STOCK').length;

    return {
      summary: {
        totalProducts,
        totalUnits,
        totalCostValue,
        totalRetailValue,
        potentialProfit,
        averageMargin,
        lowStockCount,
        outOfStockCount
      },
      records: data
    };
  }

  /**
   * Low Stock & Reorder Report
   */
  async getLowStock(filters) {
    const data = await ReportRepository.getLowStockReport(filters);

    const totalLowStockSkus = data.length;
    const totalUnitsToReorder = data.reduce((sum, row) => sum + parseInt(row.reorder_needed || 0), 0);
    const totalEstimatedReorderCost = data.reduce((sum, row) => sum + parseFloat(row.estimated_reorder_cost || 0), 0);
    const criticalCount = data.filter(row => row.current_stock <= 0).length;

    return {
      summary: {
        totalLowStockSkus,
        totalUnitsToReorder,
        totalEstimatedReorderCost,
        criticalCount
      },
      records: data
    };
  }

  /**
   * Category Stock Valuation Report
   */
  async getCategoryStockValuation(filters) {
    const data = await ReportRepository.getCategoryStockValuationReport(filters);

    const totalCategories = data.length;
    const totalSkus = data.reduce((sum, row) => sum + parseInt(row.total_skus || 0), 0);
    const totalUnits = data.reduce((sum, row) => sum + parseInt(row.total_units || 0), 0);
    const totalCostValue = data.reduce((sum, row) => sum + parseFloat(row.total_cost_value || 0), 0);
    const totalRetailValue = data.reduce((sum, row) => sum + parseFloat(row.total_retail_value || 0), 0);
    const totalPotentialProfit = totalRetailValue - totalCostValue;
    const averageMargin = totalRetailValue > 0 ? (totalPotentialProfit / totalRetailValue) * 100 : 0;

    return {
      summary: {
        totalCategories,
        totalSkus,
        totalUnits,
        totalCostValue,
        totalRetailValue,
        totalPotentialProfit,
        averageMargin
      },
      records: data
    };
  }

  /**
   * Payment Type-Wise Daily Collections Report
   */
  async getPaymentTypeWiseDailyCollections(filters) {
    const data = await ReportRepository.getPaymentTypeWiseDailyCollectionsReport(filters);

    const totalDays = data.length;
    const totalInvoices = data.reduce((sum, row) => sum + parseInt(row.total_invoices || 0), 0);
    const totalNetSales = data.reduce((sum, row) => sum + parseFloat(row.total_net_sales || 0), 0);
    const totalCollected = data.reduce((sum, row) => sum + parseFloat(row.total_collected || 0), 0);
    const totalBalance = data.reduce((sum, row) => sum + parseFloat(row.total_balance || 0), 0);
    const totalCash = data.reduce((sum, row) => sum + parseFloat(row.cash_collected || 0), 0);
    const totalCard = data.reduce((sum, row) => sum + parseFloat(row.card_collected || 0), 0);
    const totalUpi = data.reduce((sum, row) => sum + parseFloat(row.upi_collected || 0), 0);
    const totalCheque = data.reduce((sum, row) => sum + parseFloat(row.cheque_collected || 0), 0);
    const totalOther = data.reduce((sum, row) => sum + parseFloat(row.other_collected || 0), 0);
    const avgDailyCollection = totalDays > 0 ? totalCollected / totalDays : 0;

    const paymentMethodsDistribution = [
      { name: 'Cash', value: totalCash, color: '#10B981' },
      { name: 'Card', value: totalCard, color: '#3B82F6' },
      { name: 'UPI / QR', value: totalUpi, color: '#6366F1' },
      { name: 'Cheque', value: totalCheque, color: '#8B5CF6' },
      { name: 'Other', value: totalOther, color: '#F59E0B' }
    ].filter(item => item.value > 0);

    return {
      summary: {
        totalDays,
        totalInvoices,
        totalNetSales,
        totalCollected,
        totalBalance,
        totalCash,
        totalCard,
        totalUpi,
        totalCheque,
        totalOther,
        avgDailyCollection,
        paymentMethodsDistribution
      },
      records: data
    };
  }
}

module.exports = new ReportService();
