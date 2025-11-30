import path from 'path';
import { promises as fs } from 'fs';
import XLSX from 'xlsx';
import FileUpload from '../models/FileUpload.js';
import { trackActivity } from '../middleware/activityTracker.js';

// Data analysis function for chart generation
const analyzeData = (data) => {
  if (!data || data.length === 0) {
    return {
      columns: [],
      dataTypes: {},
      rowCount: 0,
      columnCount: 0
    };
  }

  const columns = Object.keys(data[0]);
  const dataTypes = {};

  columns.forEach(column => {
    const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined && val !== '');

    if (values.length === 0) {
      dataTypes[column] = { type: 'empty', sample: null };
      return;
    }

    // Check if numeric
    const numericValues = values.filter(val => !isNaN(parseFloat(val)) && isFinite(val));
    if (numericValues.length === values.length) {
      dataTypes[column] = { type: 'numeric', sample: numericValues[0] };
    } else {
      // Check if date
      const dateValues = values.filter(val => !isNaN(Date.parse(val)));
      if (dateValues.length > values.length * 0.5) {
        dataTypes[column] = { type: 'date', sample: dateValues[0] };
      } else {
        dataTypes[column] = { type: 'categorical', sample: values[0] };
      }
    }
  });

  return {
    columns,
    dataTypes,
    rowCount: data.length,
    columnCount: columns.length
  };
};

// Upload file controller with activity tracking
export const uploadFile = async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Read uploaded Excel file
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Calculate processing duration
    const processingDuration = Date.now() - startTime;

    // Analyze data for chart generation
    const analysis = analyzeData(jsonData);

    // Save file upload record to database
    const fileUpload = await FileUpload.create({
      user: user._id,
      username: user.username,
      email: user.email,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: path.extname(req.file.originalname).toLowerCase(),
      mimeType: req.file.mimetype,
      filePath: filePath,
      status: 'processed',
      processingResult: {
        rowCount: jsonData.length,
        columnCount: jsonData.length > 0 ? Object.keys(jsonData[0]).length : 0,
        headers: jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
        dataPreview: jsonData.slice(0, 5), // First 5 rows as preview
      },
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown',
        uploadDuration: processingDuration,
        processingDuration,
      }
    });

    // Track file upload activity
    await trackActivity(
      req,
      'file_upload',
      `Uploaded file: ${req.file.originalname}`,
      {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: path.extname(req.file.originalname).toLowerCase(),
        rowCount: jsonData.length,
        columnCount: jsonData.length > 0 ? Object.keys(jsonData[0]).length : 0,
      }
    );

    // Return parsed data to frontend
    res.status(200).json({
      message: 'File uploaded and parsed successfully',
      data: jsonData,
      analysis: analysis,
      fileUpload: {
        id: fileUpload._id,
        fileName: fileUpload.fileName,
        originalName: fileUpload.originalName,
        fileSize: fileUpload.fileSize,
        rowCount: fileUpload.processingResult.rowCount,
        columnCount: fileUpload.processingResult.columnCount,
      }
    });

    // Asynchronously delete the temporary file after the response has been sent.
    fs.unlink(filePath).catch(err => console.error(`Error deleting temporary file: ${err.message}`));
  } catch (error) {
    console.error('File upload error:', error);

    // Track failed upload
    if (req.user && req.file) {
      await trackActivity(
        req,
        'file_upload',
        `Failed to upload file: ${req.file.originalname}`,
        {
          fileName: req.file.originalname,
          error: error.message,
        }
      ).catch(console.error);
    }

    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Dashboard data controller with activity tracking
export const getDashboardData = async (req, res) => {
  try {
    const user = req.user;

    // Get user's recent file uploads
    const recentUploads = await FileUpload.find({
      user: user._id,
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('fileName originalName fileSize createdAt processingResult');

    // Get user's activity stats
    const UserActivity = (await import('../models/UserActivity.js')).default;

    const userActivities = await UserActivity.find({ user: user._id })
      .sort({ timestamp: -1 })
      .limit(10);

    // Track dashboard view
    await trackActivity(
      req,
      'page_visit',
      'Viewed dashboard',
      { pageUrl: '/dashboard' }
    );

    const data = {
      recentUploads: recentUploads,
      recentActivities: userActivities,
      chartsGenerated: 12,
      lastLogin: user.lastLogin,
    };

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Chart creation tracking
export const createChart = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { chartType, data, title } = req.body;

    // Track chart creation
    await trackActivity(
      req,
      'chart_created',
      `Created ${chartType} chart: ${title || 'Untitled'}`,
      {
        chartType,
        title: title || 'Untitled',
        dataPoints: Array.isArray(data) ? data.length : 0,
      }
    );

    res.status(200).json({
      message: 'Chart created successfully',
      chartId: 'chart_' + Date.now()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Chart export tracking
export const exportChart = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { chartId, format } = req.body;

    // Track chart export
    await trackActivity(
      req,
      'chart_exported',
      `Exported chart ${chartId} as ${format}`,
      {
        chartId,
        format,
      }
    );

    res.status(200).json({
      message: 'Chart exported successfully',
      downloadUrl: `/exports/chart_${chartId}.${format}`
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
