import UserActivity from '../models/UserActivity.js';

/**
 * Log user activity to the database
 * @param {Object} user - User object
 * @param {String} action - Action type
 * @param {String} description - Description of the activity
 * @param {Object} metadata - Additional metadata (optional)
 * @param {String} sessionId - Session ID (optional)
 */
export const logUserActivity = async (user, action, description, metadata = {}, sessionId = null) => {
  try {
    const activityData = {
      user: user._id,
      username: user.username,
      email: user.email,
      action,
      description,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      },
      sessionId
    };

    await UserActivity.create(activityData);
  } catch (error) {
    console.error('Failed to log user activity:', error);
    // Don't throw error to avoid breaking the main flow
  }
};

/**
 * Log OTP-related activities
 * @param {Object} user - User object
 * @param {String} action - OTP action type
 * @param {String} type - OTP type (mobile/email)
 * @param {Object} metadata - Additional metadata
 * @param {String} sessionId - Session ID
 */
export const logOTPActivity = async (user, action, type, metadata = {}, sessionId = null) => {
  const descriptions = {
    otp_sent: `OTP sent to ${type}`,
    otp_verified: `OTP verified successfully for ${type}`,
    otp_failed: `OTP verification failed for ${type}`,
    otp_resend: `OTP resent to ${type}`,
    account_verified: `Account fully verified via ${type}`
  };

  await logUserActivity(
    user,
    action,
    descriptions[action] || `OTP ${action} for ${type}`,
    {
      otpType: type,
      ...metadata
    },
    sessionId
  );
};
