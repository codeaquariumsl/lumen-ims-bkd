const pool = require('../config/database');

class SettingsRepository {
  async getCompanyDetails() {
    const [rows] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = ?', ['company_details']);
    if (rows.length > 0) {
      try {
        return JSON.parse(rows[0].setting_value);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  async saveCompanyDetails(details) {
    const valueStr = JSON.stringify(details);
    const query = `
      INSERT INTO settings (setting_key, setting_value) 
      VALUES ('company_details', ?) 
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `;
    await pool.query(query, [valueStr]);
    return details;
  }
}

module.exports = new SettingsRepository();
