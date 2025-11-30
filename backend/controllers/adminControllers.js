import User from '../models/User.js';
import FileUpload from '../models/FileUpload.js';
import UserActivity from '../models/UserActivity.js';

// @desc    Get all users with credentials
// @route   GET /api/admin/users
// @access  Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('username email role isActive lastLogin createdAt loginHistory')
      .sort({ createdAt: -1 });

    // Add credential information for admin view
    const usersWithCredentials = users.map(user => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      loginCount: user.loginHistory ? user.loginHistory.length : 0,
      // Don't expose actual passwords, but show if they exist
      hasPassword: !!user.password,
      // Show recent login attempts
      recentLogins: user.loginHistory ? user.loginHistory.slice(0, 5).map(login => ({
        timestamp: login.timestamp,
        ipAddress: login.ipAddress,
        userAgent: login.userAgent,
        success: login.success
      })) : []
    }));

    res.json({
      success: true,
      count: users.length,
      data: usersWithCredentials
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single user with credentials
// @route   GET /api/admin/users/:id
// @access  Admin
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username email role isActive lastLogin createdAt loginHistory password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's file upload history
    const fileUploads = await FileUpload.find({ user: user._id, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get user's activity history
    const activities = await UserActivity.find({ user: user._id })
      .sort({ timestamp: -1 })
      .limit(20);

    const userWithCredentials = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      // Credential information
      hasPassword: !!user.password,
      passwordLastChanged: user.updatedAt, // This would need a separate field for accuracy
      // Login history
      loginHistory: user.loginHistory || [],
      totalLogins: user.loginHistory ? user.loginHistory.length : 0,
      // File upload statistics
      filesUploaded: fileUploads.length,
      recentFiles: fileUploads,
      // Activity statistics
      totalActivities: activities.length,
      recentActivities: activities,
      // Account security info
      accountStatus: user.isActive ? 'Active' : 'Inactive',
      accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)), // days
    };

    res.json({
      success: true,
      data: userWithCredentials
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Admin
export const updateUser = async (req, res) => {
  try {
    const { username, email, role, isActive, resetPassword } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from demoting themselves
    if (user._id.toString() === req.user._id.toString() && role && role !== 'admin' && role !== 'superadmin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.role = role || user.role;
    user.isActive = isActive !== undefined ? isActive : user.isActive;

    // Reset password if requested
    if (resetPassword) {
      user.password = resetPassword; // This should be hashed in the User model pre-save hook
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create admin user
// @route   POST /api/admin/create-admin
// @access  SuperAdmin
export const createAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/admin/stats
// @access  Admin
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: { $in: ['admin', 'superadmin'] } });
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Get file upload statistics
    const totalFiles = await FileUpload.countDocuments({ isDeleted: false });
    const recentFiles = await FileUpload.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      isDeleted: false
    });

    // Get activity statistics
    const totalActivities = await UserActivity.countDocuments({
      timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        adminUsers,
        recentUsers,
        inactiveUsers: totalUsers - activeUsers,
        // File statistics
        totalFiles,
        recentFiles,
        // Activity statistics
        totalActivities
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get login history
// @route   GET /api/admin/login-history
// @access  Admin
export const getLoginHistory = async (req, res) => {
  try {
    const users = await User.find({})
      .select('username email lastLogin loginHistory')
      .sort({ 'loginHistory.timestamp': -1 });

    const allLoginHistory = users.flatMap(user =>
      user.loginHistory.map(login => ({
        username: user.username,
        email: user.email,
        ...login.toObject()
      }))
    );

    res.json({
      success: true,
      data: allLoginHistory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get all files with user information
// @route   GET /api/admin/files
// @access  Admin
export const getAllFiles = async (req, res) => {
  try {
    const { page = 1, limit = 10, user, status, fileType } = req.query;

    let query = { isDeleted: false };

    if (user) query.user = user;
    if (status) query.status = status;
    if (fileType) query.fileType = fileType;

    const files = await FileUpload.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'username email role')
      .select('-__v');

    const total = await FileUpload.countDocuments(query);

    res.json({
      success: true,
      data: files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
