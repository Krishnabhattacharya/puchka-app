const { verifyAccessToken } = require('../utils/jwt.utils');
const User = require('../models/userSchema');
const Admin = require('../models/admin.model');

// Protect User Routes
const authenticateUser = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyAccessToken(token, 'user');

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated.'
      });
    }

    // Check if user changed password after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Password recently changed. Please login again.'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account is temporarily locked. Please try again later.'
      });
    }

    // Grant access
    req.user = user;
    req.userId = user._id;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid token.'
    });
  }
};

// Protect Admin Routes
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyAccessToken(token, 'admin');

    // Check if decoded role is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Check if admin still exists
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin no longer exists.'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your admin account has been deactivated.'
      });
    }

    // Check if password changed after token was issued
    if (admin.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Password recently changed. Please login again.'
      });
    }

    // Check if account is locked
    if (admin.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account is temporarily locked. Please try again later.'
      });
    }

    // Grant access
    req.admin = admin;
    req.adminId = admin._id;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid token.'
    });
  }
};

// Check Admin Permissions
const checkPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    // Super admin has all permissions
    if (req.admin.role === 'super_admin') {
      return next();
    }

    // Check if admin has required permission
    const hasPermission = permissions.some(permission => 
      req.admin.hasPermission(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.'
      });
    }

    next();
  };
};

// Optional Authentication (for routes that work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token, 'user');
    
    const user = await User.findById(decoded.id);
    if (user && user.isActive && !user.isLocked) {
      req.user = user;
      req.userId = user._id;
    }
    
    next();
  } catch (error) {
    // If token is invalid, continue without user
    next();
  }
};

module.exports = {
  authenticateUser,
  authenticateAdmin,
  checkPermission,
  optionalAuth
};