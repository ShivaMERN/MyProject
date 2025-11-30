import express from 'express';
import {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  createAdmin,
  getUserStats,
  getLoginHistory,
  getAllFiles
} from '../controllers/adminControllers.js';
import { protect, admin, superadmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(admin);

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// File management routes
router.get('/files', getAllFiles);

// Statistics route
router.get('/stats', getUserStats);

// Login history route
router.get('/login-history', getLoginHistory);

// Create admin route (superadmin only)
router.post('/create-admin', superadmin, createAdmin);

export default router;
