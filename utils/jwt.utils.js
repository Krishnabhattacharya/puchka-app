const jwt = require('jsonwebtoken');
const Token = require('../models/token.model');

// Generate Access Token
const generateAccessToken = (userId, role = 'user') => {
  const secret = role === 'admin' 
    ? process.env.JWT_ADMIN_SECRET 
    : process.env.JWT_ACCESS_SECRET;
  
  return jwt.sign(
    { id: userId, role },
    secret,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
  );
};

// Generate Refresh Token
const generateRefreshToken = (userId, role = 'user') => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );
};

// Store Refresh Token in Database
const storeRefreshToken = async (userId, refreshToken, req) => {
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRY || '7d';
  const expiryTime = expiresIn.includes('d') 
    ? parseInt(expiresIn) * 24 * 60 * 60 * 1000 
    : parseInt(expiresIn) * 60 * 60 * 1000;

  await Token.create({
    userId,
    refreshToken,
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip || req.connection.remoteAddress,
    expiresAt: new Date(Date.now() + expiryTime)
  });
};

// Verify Access Token
const verifyAccessToken = (token, role = 'user') => {
  try {
    const secret = role === 'admin' 
      ? process.env.JWT_ADMIN_SECRET 
      : process.env.JWT_ACCESS_SECRET;
    
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

// Verify Refresh Token
const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    // Check if token exists in database and is valid
    const tokenDoc = await Token.findOne({
      refreshToken: token,
      userId: decoded.id,
      isValid: true
    });

    if (!tokenDoc) {
      throw new Error('Invalid refresh token');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

// Generate Token Pair
const generateTokenPair = async (userId, role, req) => {
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId, role);
  
  await storeRefreshToken(userId, refreshToken, req);
  
  return { accessToken, refreshToken };
};

// Invalidate Refresh Token
const invalidateRefreshToken = async (token) => {
  const tokenDoc = await Token.findOne({ refreshToken: token });
  if (tokenDoc) {
    await tokenDoc.invalidate();
  }
};

// Invalidate All User Tokens (Logout from all devices)
const invalidateAllUserTokens = async (userId) => {
  await Token.invalidateUserTokens(userId);
};

// Decode Token Without Verification (for expired token info)
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  invalidateRefreshToken,
  invalidateAllUserTokens,
  decodeToken
};