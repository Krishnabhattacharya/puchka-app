const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  refreshToken: {
    type: String,
    required: true
  },
  isValid: {
    type: Boolean,
    default: true
  },
  userAgent: {
    type: String
  },
  ipAddress: {
    type: String
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Index for automatic deletion of expired tokens
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for faster queries
tokenSchema.index({ userId: 1, isValid: 1 });
tokenSchema.index({ refreshToken: 1 });

// Method to invalidate token
tokenSchema.methods.invalidate = async function() {
  this.isValid = false;
  return this.save();
};

// Static method to invalidate all user tokens
tokenSchema.statics.invalidateUserTokens = async function(userId) {
  return this.updateMany(
    { userId, isValid: true },
    { isValid: false }
  );
};

// Static method to cleanup expired tokens manually (if needed)
tokenSchema.statics.cleanupExpired = async function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

module.exports = mongoose.model('Token', tokenSchema);