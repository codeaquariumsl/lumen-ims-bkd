const { validationResult } = require('express-validator');
const { sendResponse } = require('../utils/response');

/**
 * Middleware to execute express-validator validation rules.
 * @param {Array} validations List of validation rules to run
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorMsg = errors.array().map((err) => err.msg).join('; ');
    return sendResponse(res, 400, false, errorMsg, {
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg
      }))
    });
  };
};

module.exports = validate;
