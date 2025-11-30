import express from 'express';
import {
  uploadFile,
  getDashboardData,
  createChart,
  exportChart
} from '../controllers/enhancedChartController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
    }
  }
});

// All routes require authentication
router.use(protect);

// File upload route
router.post('/upload', upload.single('file'), uploadFile);

// Dashboard data route
router.get('/dashboard', getDashboardData);

// Chart creation route
router.post('/create', createChart);

// Chart export route
router.post('/export', exportChart);

export default router;
