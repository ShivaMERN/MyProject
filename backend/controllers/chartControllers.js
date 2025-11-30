import path from 'path';
import { promises as fs } from 'fs';
import XLSX from 'xlsx';

// Upload file controller
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Read uploaded Excel file
    // req.file.path is already the full path to the uploaded file.
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Return parsed data to frontend
    res.status(200).json({ message: 'File uploaded and parsed successfully', data: jsonData });

    // Asynchronously delete the temporary file after the response has been sent.
    fs.unlink(filePath).catch(err => console.error(`Error deleting temporary file: ${err.message}`));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Dashboard data controller
export const getDashboardData = async (req, res) => {
  try {
    // For demo, returning static data. Replace with real DB queries.
    const data = {
      recentUploads: 5,
      chartsGenerated: 12,
      lastLogin: new Date().toISOString(),
    };
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
