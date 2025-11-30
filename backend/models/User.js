import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    mobileOTPHash: {
      type: String,
    },
    emailOTPHash: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    otpResendCount: {
      type: Number,
      default: 0,
    },
    mobileVerifiedAt: {
      type: Date,
    },
    emailVerifiedAt: {
      type: Date,
    },
    requireVerification: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    loginHistory: [{
      timestamp: {
        type: Date,
        default: Date.now,
      },
      ipAddress: String,
      userAgent: String,
    }],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and store OTP for verification
userSchema.methods.generateAndStoreOTP = async function({ type, length = 6, ttlSeconds = 300 }) {
  // Generate numeric OTP
  const otp = Math.floor(Math.pow(10, length - 1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1))).toString();

  // Hash OTP using bcrypt
  const saltRounds = 10;
  const otpHash = await bcrypt.hash(otp, saltRounds);

  // Set expiry time
  const otpExpiry = new Date(Date.now() + ttlSeconds * 1000);

  // Store based on type
  if (type === 'mobile') {
    this.mobileOTPHash = otpHash;
  } else if (type === 'email') {
    this.emailOTPHash = otpHash;
  }

  this.otpExpiry = otpExpiry;
  this.otpAttempts = 0; // Reset attempts for new OTP

  await this.save();

  return otp; // Return raw OTP for sending
};

// Verify OTP with security checks
userSchema.methods.verifyOTP = async function({ type, rawOtp }) {
  const maxAttempts = process.env.OTP_MAX_ATTEMPTS ? parseInt(process.env.OTP_MAX_ATTEMPTS) : 5;

  // Check if OTP exists and hasn't expired
  if (!this.otpExpiry || this.otpExpiry < new Date()) {
    return {
      success: false,
      message: 'OTP expired. Please request a new OTP.',
      code: 'EXPIRED'
    };
  }

  // Check attempts limit
  if (this.otpAttempts >= maxAttempts) {
    return {
      success: false,
      message: 'Too many failed attempts. Please request a new OTP.',
      code: 'TOO_MANY_ATTEMPTS'
    };
  }

  // Get the correct hash field
  const otpHashField = type === 'mobile' ? this.mobileOTPHash : this.emailOTPHash;

  if (!otpHashField) {
    return {
      success: false,
      message: 'No OTP found. Please request a new OTP.',
      code: 'NO_OTP'
    };
  }

  // Compare OTP
  const isValid = await bcrypt.compare(rawOtp, otpHashField);

  if (!isValid) {
    // Increment attempts on failure
    this.otpAttempts += 1;
    await this.save();

    const remainingAttempts = maxAttempts - this.otpAttempts;
    return {
      success: false,
      message: `Incorrect OTP. ${remainingAttempts} attempts remaining.`,
      code: 'INVALID_OTP',
      remainingAttempts
    };
  }

  // OTP is valid - clear OTP data and mark as verified
  if (type === 'mobile') {
    this.isMobileVerified = true;
    this.mobileVerifiedAt = new Date();
    this.mobileOTPHash = undefined;
  } else if (type === 'email') {
    this.isEmailVerified = true;
    this.emailVerifiedAt = new Date();
    this.emailOTPHash = undefined;
  }

  this.otpExpiry = undefined;
  this.otpAttempts = 0;
  this.otpResendCount = 0; // Reset resend count on successful verification

  await this.save();

  return {
    success: true,
    message: `${type.charAt(0).toUpperCase() + type.slice(1)} verified successfully`,
    code: 'VERIFIED'
  };
};

// Check if user can request new OTP (resend throttling)
userSchema.methods.canResendOTP = function() {
  const minResendInterval = process.env.OTP_RESEND_INTERVAL_SECONDS ? parseInt(process.env.OTP_RESEND_INTERVAL_SECONDS) : 30;
  const maxResendsPerDay = process.env.OTP_MAX_RESEND_PER_DAY ? parseInt(process.env.OTP_MAX_RESEND_PER_DAY) : 5;

  // Check resend count limit
  if (this.otpResendCount >= maxResendsPerDay) {
    return {
      canResend: false,
      reason: 'Maximum resend attempts reached for today'
    };
  }

  // Check time since last OTP generation (if otpExpiry exists)
  if (this.otpExpiry) {
    const timeSinceLastOTP = Date.now() - (this.otpExpiry.getTime() - (process.env.OTP_TTL_SECONDS ? parseInt(process.env.OTP_TTL_SECONDS) : 300) * 1000);
    const minIntervalMs = minResendInterval * 1000;

    if (timeSinceLastOTP < minIntervalMs) {
      const remainingTime = Math.ceil((minIntervalMs - timeSinceLastOTP) / 1000);
      return {
        canResend: false,
        reason: `Please wait ${remainingTime} seconds before requesting a new OTP`
      };
    }
  }

  return { canResend: true };
};

const User = mongoose.model('User', userSchema);

export default User;
