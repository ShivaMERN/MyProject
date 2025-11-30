import UserActivity from '../models/UserActivity.js';
import UserSession from '../models/UserSession.js';
import crypto from 'crypto';

// Generate session ID
const generateSessionId = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Get client information
const getClientInfo = (req) => {
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';

  // Parse user agent for basic device info
  const deviceInfo = parseUserAgent(userAgent);

  return {
    ipAddress,
    userAgent,
    deviceInfo,
  };
};

// Parse user agent (basic implementation)
const parseUserAgent = (userAgent) => {
  if (!userAgent || userAgent === 'Unknown') return 'Unknown Device';

  const ua = userAgent.toLowerCase();

  if (ua.includes('mobile')) return 'Mobile Device';
  if (ua.includes('tablet')) return 'Tablet';
  if (ua.includes('windows')) return 'Windows Desktop';
  if (ua.includes('macintosh') || ua.includes('mac os')) return 'Mac Desktop';
  if (ua.includes('linux')) return 'Linux Desktop';
  if (ua.includes('android')) return 'Android Device';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS Device';

  return 'Desktop';
};

// Create or update user session
export const createOrUpdateSession = async (req, user) => {
  try {
    const clientInfo = getClientInfo(req);
    const sessionId = req.sessionID || generateSessionId();

    let session = await UserSession.findOne({
      user: user._id,
      sessionId,
      isActive: true
    });

    if (!session) {
      session = await UserSession.create({
        user: user._id,
        username: user.username,
        email: user.email,
        sessionId,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        deviceInfo: clientInfo.deviceInfo,
        isActive: true,
        metadata: {
          browser: getBrowserFromUserAgent(clientInfo.userAgent),
          os: getOSFromUserAgent(clientInfo.userAgent),
          platform: getPlatformFromUserAgent(clientInfo.userAgent),
        }
      });
    }

    return session;
  } catch (error) {
    console.error('Error creating/updating session:', error);
    return null;
  }
};

// Track user activity
export const trackActivity = async (req, action, description, metadata = {}) => {
  try {
    const user = req.user;
    if (!user) return;

    const clientInfo = getClientInfo(req);

    const activityData = {
      user: user._id,
      username: user.username,
      email: user.email,
      action,
      description,
      metadata: {
        ...metadata,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      },
      sessionId: req.sessionID,
    };

    const activity = await UserActivity.create(activityData);

    // Add activity to user session
    if (req.session) {
      await UserSession.findOneAndUpdate(
        { user: user._id, sessionId: req.sessionID, isActive: true },
        {
          $push: {
            activities: {
              action,
              description,
              timestamp: new Date(),
              metadata,
            }
          }
        }
      );
    }

    return activity;
  } catch (error) {
    console.error('Error tracking activity:', error);
  }
};

// Track logout
export const trackLogout = async (req) => {
  try {
    const user = req.user;
    if (!user) return;

    // Update session logout time
    await UserSession.findOneAndUpdate(
      { user: user._id, sessionId: req.sessionID, isActive: true },
      {
        logoutTime: new Date(),
        isActive: false,
        $inc: { duration: Date.now() - new Date().getTime() }
      }
    );

    // Track logout activity
    await trackActivity(req, 'logout', 'User logged out');
  } catch (error) {
    console.error('Error tracking logout:', error);
  }
};

// Middleware to track page visits
export const trackPageVisit = (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    // Track page visit after response is sent
    if (req.user && req.originalUrl) {
      trackActivity(
        req,
        'page_visit',
        `Visited ${req.originalUrl}`,
        { pageUrl: req.originalUrl }
      ).catch(console.error);
    }

    originalSend.call(this, data);
  };

  next();
};

// Helper functions for parsing user agent
const getBrowserFromUserAgent = (userAgent) => {
  if (!userAgent) return 'Unknown';

  const ua = userAgent.toLowerCase();

  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edge')) return 'Edge';
  if (ua.includes('opera')) return 'Opera';

  return 'Unknown';
};

const getOSFromUserAgent = (userAgent) => {
  if (!userAgent) return 'Unknown';

  const ua = userAgent.toLowerCase();

  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('macintosh') || ua.includes('mac os')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';

  return 'Unknown';
};

const getPlatformFromUserAgent = (userAgent) => {
  if (!userAgent) return 'Unknown';

  const ua = userAgent.toLowerCase();

  if (ua.includes('mobile')) return 'Mobile';
  if (ua.includes('tablet')) return 'Tablet';

  return 'Desktop';
};
