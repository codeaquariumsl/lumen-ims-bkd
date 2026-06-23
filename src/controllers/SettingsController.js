const SettingsRepository = require('../repositories/SettingsRepository');
const { sendResponse } = require('../utils/response');

class SettingsController {
  async getCompanySettings(req, res, next) {
    try {
      const details = await SettingsRepository.getCompanyDetails();
      return sendResponse(res, 200, true, 'Settings loaded successfully', { settings: details || {} });
    } catch (error) {
      next(error);
    }
  }

  async saveCompanySettings(req, res, next) {
    try {
      const details = await SettingsRepository.saveCompanyDetails(req.body);
      return sendResponse(res, 200, true, 'Settings saved successfully', { settings: details });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SettingsController();
