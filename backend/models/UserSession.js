import mongoose from 'mongoose';

const userSessionSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    deviceInfo: {
      type: String,
    },
    location: {
      country: String,
      city: String,
      region: String,
    },
    loginTime: {
      type: Date,
      default: Date.now,
    },
    logoutTime: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    duration: {
      type: Number, // in milliseconds
    },
    activities: [{
      action: String,
      description: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      metadata: mongoose.Schema.Types.Mixed,
    }],
    metadata: {
      browser: String,
      os: String,
      platform: String,
      screenResolution: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
userSessionSchema.index({ user: 1, isActive: 1 });
userSessionSchema.index({ sessionId: 1 });
userSessionSchema.index({ loginTime: -1 });
userSessionSchema.index({ ipAddress: 1, loginTime: -1 });

const UserSession = mongoose.model('UserSession', userSessionSchema);

export default UserSession;
