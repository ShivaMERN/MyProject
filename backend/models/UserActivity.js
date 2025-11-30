import mongoose from 'mongoose';

const userActivitySchema = mongoose.Schema(
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
    action: {
      type: String,
      required: true,
      enum: [
        'login',
        'logout',
        'file_upload',
        'chart_created',
        'chart_exported',
        'page_visit',
        'profile_updated',
        'password_changed',
        'settings_changed',
        'admin_action',
        'otp_sent',
        'otp_verified',
        'otp_failed',
        'otp_resend',
        'account_verified'
      ],
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      fileName: String,
      fileSize: Number,
      chartType: String,
      pageUrl: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
      adminAction: String,
      targetUser: String,
    },
    sessionId: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
userActivitySchema.index({ user: 1, timestamp: -1 });
userActivitySchema.index({ action: 1, timestamp: -1 });
userActivitySchema.index({ timestamp: -1 });

const UserActivity = mongoose.model('UserActivity', userActivitySchema);

export default UserActivity;
