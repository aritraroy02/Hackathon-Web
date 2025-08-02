const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Trust proxy for Cloud Run (this fixes rate limiting issues)
app.set('trust proxy', true);

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-frontend-domain.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting - Disabled for development, allows all IPs
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Very high limit to allow all requests
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting - allow all IPs
  skip: () => true, // This bypasses rate limiting completely
  trustProxy: true,
  keyGenerator: (req) => {
    return 'allowed'; // Use same key for all requests
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://harshbontala188:8I52Oqeh3sWYTDJ7@cluster0.5lsiap2.mongodb.net/childBooklet?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Child Health Record Schema
const childHealthSchema = new mongoose.Schema({
  // Child Information
  childName: { type: String, required: true, trim: true },
  age: { type: String, required: true },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  weight: { type: String, required: true },
  height: { type: String, required: true },
  
  // Guardian Information
  guardianName: { type: String, required: true, trim: true },
  relation: { type: String, required: true },
  phone: { type: String, required: true },
  parentsConsent: { type: Boolean, required: true },
  
  // Health & Identification
  healthId: { type: String, required: true, unique: true },
  facePhoto: { type: String, default: null }, // Base64 or URL
  localId: { type: String, required: true },
  idType: { type: String, default: 'aadhar' },
  countryCode: { type: String, default: '+91' },
  malnutritionSigns: { type: String, default: '' },
  recentIllnesses: { type: String, default: '' },
  skipMalnutrition: { type: Boolean, default: false },
  skipIllnesses: { type: Boolean, default: false },
  
  // Timestamps & Status
  dateCollected: { type: Date, required: true },
  isOffline: { type: Boolean, default: false },
  
  // Location Data
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    accuracy: { type: Number },
    timestamp: { type: Date }
  },
  
  // Upload Tracking
  uploadedBy: { type: String, required: true },
  uploaderUIN: { type: String, required: true },
  uploaderEmployeeId: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  
  // System fields
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'childHealthRecords'
});

// Indexes for better performance
childHealthSchema.index({ healthId: 1 });
childHealthSchema.index({ uploaderUIN: 1 });
childHealthSchema.index({ uploadedAt: -1 });
childHealthSchema.index({ 'location.city': 1, 'location.state': 1 });

const ChildHealthRecord = mongoose.model('ChildHealthRecord', childHealthSchema);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Child Health Backend API is running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'API endpoints are working',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Get all children records
app.get('/api/children', async (req, res) => {
  try {
    const { page = 1, limit = 50, uploaderUIN, city, state } = req.query;
    
    // Build query
    const query = {};
    if (uploaderUIN) query.uploaderUIN = uploaderUIN;
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (state) query['location.state'] = new RegExp(state, 'i');
    
    // Execute query with pagination
    const children = await ChildHealthRecord.find(query)
      .sort({ uploadedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await ChildHealthRecord.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: children,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total: total
      }
    });
  } catch (error) {
    console.error('Error fetching children:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch children records',
      error: error.message
    });
  }
});

// Create new child record
app.post('/api/children', async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = [
      'childName', 'age', 'gender', 'weight', 'height',
      'guardianName', 'relation', 'phone', 'parentsConsent',
      'healthId', 'localId', 'dateCollected',
      'uploadedBy', 'uploaderUIN'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields: missingFields
      });
    }
    
    // Check if healthId already exists
    const existingRecord = await ChildHealthRecord.findOne({ healthId: req.body.healthId });
    if (existingRecord) {
      return res.status(409).json({
        success: false,
        message: 'Health ID already exists',
        healthId: req.body.healthId
      });
    }
    
    // Create new record
    const childRecord = new ChildHealthRecord(req.body);
    const savedRecord = await childRecord.save();
    
    console.log(`✅ New child record created: ${savedRecord.healthId} by ${savedRecord.uploadedBy}`);
    
    res.status(201).json({
      success: true,
      message: 'Child record created successfully',
      data: savedRecord
    });
  } catch (error) {
    console.error('Error creating child record:', error);
    
    if (error.code === 11000) {
      // Duplicate key error
      res.status(409).json({
        success: false,
        message: 'Duplicate record found',
        error: 'Health ID or Local ID already exists'
      });
    } else if (error.name === 'ValidationError') {
      // Mongoose validation error
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create child record',
        error: error.message
      });
    }
  }
});

// Get child record by ID
app.get('/api/children/:id', async (req, res) => {
  try {
    const child = await ChildHealthRecord.findById(req.params.id);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: child
    });
  } catch (error) {
    console.error('Error fetching child:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch child record',
      error: error.message
    });
  }
});

// Update child record
app.put('/api/children/:id', async (req, res) => {
  try {
    const updatedChild = await ChildHealthRecord.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!updatedChild) {
      return res.status(404).json({
        success: false,
        message: 'Child record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Child record updated successfully',
      data: updatedChild
    });
  } catch (error) {
    console.error('Error updating child:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update child record',
      error: error.message
    });
  }
});

// Delete child record
app.delete('/api/children/:id', async (req, res) => {
  try {
    const deletedChild = await ChildHealthRecord.findByIdAndDelete(req.params.id);
    if (!deletedChild) {
      return res.status(404).json({
        success: false,
        message: 'Child record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Child record deleted successfully',
      data: deletedChild
    });
  } catch (error) {
    console.error('Error deleting child:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete child record',
      error: error.message
    });
  }
});

// Get upload statistics for a user
app.get('/api/stats/:uin', async (req, res) => {
  try {
    const { uin } = req.params;
    
    const stats = await ChildHealthRecord.aggregate([
      { $match: { uploaderUIN: uin } },
      {
        $group: {
          _id: null,
          totalUploaded: { $sum: 1 },
          lastUpload: { $max: '$uploadedAt' },
          locations: { $addToSet: '$location.city' },
          avgAge: { $avg: { $toDouble: '$age' } }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalUploaded: 0,
      lastUpload: null,
      locations: [],
      avgAge: 0
    };
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// Batch upload endpoint
app.post('/api/children/batch', async (req, res) => {
  try {
    const { records } = req.body;
    
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Records array is required and must not be empty'
      });
    }
    
    const results = {
      successful: [],
      failed: [],
      total: records.length
    };
    
    for (const record of records) {
      try {
        // Check if healthId already exists
        const existing = await ChildHealthRecord.findOne({ healthId: record.healthId });
        if (existing) {
          results.failed.push({
            record: record,
            error: 'Health ID already exists'
          });
          continue;
        }
        
        const childRecord = new ChildHealthRecord(record);
        const saved = await childRecord.save();
        results.successful.push(saved);
      } catch (error) {
        results.failed.push({
          record: record,
          error: error.message
        });
      }
    }
    
    console.log(`📊 Batch upload completed: ${results.successful.length} successful, ${results.failed.length} failed`);
    
    res.status(200).json({
      success: true,
      message: `Batch upload completed: ${results.successful.length}/${results.total} successful`,
      data: results
    });
  } catch (error) {
    console.error('Error in batch upload:', error);
    res.status(500).json({
      success: false,
      message: 'Batch upload failed',
      error: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
const PORT = process.env.PORT || 8080; // Google Cloud Run uses PORT=8080
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Child Health Backend API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/children`);
});

module.exports = app;
