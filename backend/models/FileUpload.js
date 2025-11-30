import mongoose from 'mongoose';

const fileUploadSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
    },
    status: {
      type: String,
      enum: ['uploaded', 'processed', 'failed'],
      default: 'uploaded',
    },
    processingResult: {
      rowCount: Number,
      columnCount: Number,
      headers: [String],
      dataPreview: mongoose.Schema.Types.Mixed,
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      uploadDuration: Number, // in milliseconds
      processingDuration: Number, // in milliseconds
    },
    tags: [String],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
fileUploadSchema.index({ user: 1, createdAt: -1 });
fileUploadSchema.index({ status: 1, createdAt: -1 });
fileUploadSchema.index({ fileType: 1, createdAt: -1 });
fileUploadSchema.index({ isDeleted: 1, createdAt: -1 });

const FileUpload = mongoose.model('FileUpload', fileUploadSchema);

export default FileUpload;
