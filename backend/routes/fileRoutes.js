import express from 'express';
import FileUpload from '../models/FileUpload.js';
import { protect, admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all files (admin only)
router.get('/', admin, async (req, res) => {
  try {
    const { page = 1, limit = 10, user, status, fileType, search } = req.query;

    let query = { isDeleted: false };

    // Filter by user if specified
    if (user) {
      query.user = user;
    }

    // Filter by status if specified
    if (status) {
      query.status = status;
    }

    // Filter by file type if specified
    if (fileType) {
      query.fileType = fileType;
    }

    // Search by filename or original name
    if (search) {
      query.$or = [
        { fileName: { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } }
      ];
    }

    const files = await FileUpload.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'username email')
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
});

// Get user's own files
router.get('/my-files', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = {
      user: req.user._id,
      isDeleted: false
    };

    if (status) {
      query.status = status;
    }

    const files = await FileUpload.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
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
});

// Get file statistics
router.get('/stats', admin, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    const totalFiles = await FileUpload.countDocuments({
      createdAt: { $gte: startDate },
      isDeleted: false
    });

    const filesByType = await FileUpload.aggregate([
      { $match: { createdAt: { $gte: startDate }, isDeleted: false } },
      { $group: { _id: '$fileType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const filesByUser = await FileUpload.aggregate([
      { $match: { createdAt: { $gte: startDate }, isDeleted: false } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const totalSize = await FileUpload.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$fileSize' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalFiles,
        filesByType,
        filesByUser,
        totalSize: totalSize[0]?.total || 0,
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

// Delete file (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const file = await FileUpload.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if user owns the file or is admin
    if (file.user.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this file'
      });
    }

    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// Get file by ID
router.get('/:id', async (req, res) => {
  try {
    const file = await FileUpload.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if user owns the file or is admin
    if (file.user.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this file'
      });
    }

    res.json({
      success: true,
      data: file
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
