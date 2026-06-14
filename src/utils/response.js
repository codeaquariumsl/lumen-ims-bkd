/**
 * Uniform API Response Utility
 * @param {object} res Express response object
 * @param {number} statusCode HTTP status code
 * @param {boolean} success Boolean representing success state
 * @param {string} message Descriptive message
 * @param {any} data Response payload
 * @param {object|null} pagination Pagination details (page, limit, totalItems, totalPages)
 */
const sendResponse = (res, statusCode, success, message, data = null, pagination = null) => {
  const response = {
    success,
    message,
    data: data || {}
  };

  if (pagination) {
    response.pagination = pagination;
  } else {
    response.pagination = {};
  }

  return res.status(statusCode).json(response);
};

module.exports = { sendResponse };
