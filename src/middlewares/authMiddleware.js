const { verifyToken } = require('../utils/jwt');
const UserRepository = require('../repositories/UserRepository');
const CustomError = require('../utils/customError');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new CustomError('You are not logged in. Please log in to get access.', 401));
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return next(new CustomError('Invalid token or token expired. Please log in again.', 401));
    }

    // Check if user still exists
    const user = await UserRepository.findById(decoded.id);
    if (!user) {
      return next(new CustomError('The user belonging to this token no longer exists.', 401));
    }

    if (!user.is_active) {
      return next(new CustomError('Your account has been deactivated.', 403));
    }

    // Grant access
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branch_id
    };

    next();
  } catch (error) {
    next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new CustomError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

module.exports = { protect, restrictTo };
