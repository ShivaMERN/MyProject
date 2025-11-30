import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes.js';
import chartRoutes from './routes/chartRoutes.js';
import enhancedChartRoutes from './routes/enhancedChartRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import activitiesRoutes from './routes/activitiesRoutes.js';
import fileRoutes from './routes/fileRoutes.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
// Add helmet for security headers
app.use(helmet());

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chart', chartRoutes);
app.use('/api/enhanced-chart', enhancedChartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/files', fileRoutes);

const PORT = process.env.PORT || 5001;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  } else {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📊 Health check available at: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth endpoints available at: http://localhost:${PORT}/api/auth`);
    console.log(`📈 Enhanced chart endpoints available at: http://localhost:${PORT}/api/enhanced-chart`);
    console.log(`👥 Activities endpoints available at: http://localhost:${PORT}/api/activities`);
    console.log(`📁 File management endpoints available at: http://localhost:${PORT}/api/files`);
  }
});
