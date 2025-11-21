const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
      default: "",
      trim: true,
      maxlength: 100
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false // Don't include password in queries by default
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[0-9]{10,15}$/.test(v);
        },
        message: props => `${props.value} is not a valid mobile number!`
      }
    },
    address: {
      type: String,
      required: false,
      default: "",
      trim: true,
      maxlength: 500
    },
    nearByLocation: {
      type: String,
      required: false,
      default: "",
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      required: false,
      default: "",
      trim: true,
      maxlength: 100
    },
    walletAmount: {
      type: Number,
      required: false,
      default: 0,
      min: 0
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    pincode: {
      type: Number,
      required: false,
      default: 0,
      validate: {
        validator: function(v) {
          return v === 0 || (v >= 100000 && v <= 999999);
        },
        message: props => `${props.value} is not a valid pincode!`
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    },
    passwordChangedAt: {
      type: Date
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes for better query performance
userSchema.index({ mobileNumber: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ isActive: 1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  
  // Set passwordChangedAt for password changes (not for new users)
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000; // 1 second before to handle JWT timing
  }
  
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// Check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Increment login attempts
userSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = Date.now();
  return this.save({ validateBeforeSave: false });
};

// Sanitize user data (remove sensitive fields)
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  delete obj.passwordChangedAt;
  return obj;
};

module.exports = mongoose.model("User", userSchema);