import express from 'express';
import UserActivity from '../models/UserActivity.js';
import { protect, admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get user activities (admin can get all, users can get their own)
router.get('/', async (req, res) => {
  try {
    const { user: userId, limit = 10, action, startDate, endDate } = req.query;

    let query = {};

    // If user is not admin, only show their own activities
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      query.user = req.user._id;
    } else if (userId) {
      // Admin can filter by specific user
      query.user = userId;
    }

    // Filter by action if provided
    if (action) {
      query.action = action;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const activities = await UserActivity.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('user', 'username email');

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// Get activity statistics
router.get('/stats', admin, async (req, res) => {
  try {
    const { period = '7' } = req.query; // days
    const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    const totalActivities = await UserActivity.countDocuments({
      timestamp: { $gte: startDate }
    });

    const activitiesByAction = await UserActivity.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const activitiesByUser = await UserActivity.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        totalActivities,
        activitiesByAction,
        activitiesByUser,
        period: `${period} days`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

export default router;
