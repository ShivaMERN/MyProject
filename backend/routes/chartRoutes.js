
import express from 'express';
import multer from 'multer';
import { uploadFile, getDashboardData } from '../controllers/chartControllers.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

router.post('/upload', protect, upload.single('file'), (req, res, next) => {
  console.log('File received:', req.file);
  next();
}, uploadFile);

router.get('/dashboard', protect, getDashboardData);

export default router;
