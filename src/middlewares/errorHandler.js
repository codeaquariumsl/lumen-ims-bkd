const { sendResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  
  // Include stack details only in development mode
  const responseData = process.env.NODE_ENV === 'development' ? { stack: err.stack } : {};

  // Log the details to stderr/console
  console.error(`[ERROR] [${req.method}] ${req.originalUrl} - StatusCode: ${err.statusCode} - Message: ${message}`);
  if (err.statusCode === 500) {
    console.error(err);
  }

  return sendResponse(res, err.statusCode, false, message, responseData);
};

module.exports = errorHandler;
