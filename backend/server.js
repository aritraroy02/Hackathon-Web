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

// CORS configuration - Allow ALL origins and methods
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'Access-Control-Allow-Origin'],
  exposedHeaders: ['Access-Control-Allow-Origin']
};
app.use(cors(corsOptions));

// Additional CORS headers middleware (backup)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  // Respond to preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

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

// User Schema for authentication
const userSchema = new mongoose.Schema({
  uinNumber: { 
    type: String, 
    required: true, 
    unique: true, 
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'UIN Number must be exactly 10 digits'
    }
  },
  name: { type: String, required: true, trim: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  fatherName: { type: String, trim: true },
  motherName: { type: String, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  phone: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^[\+]?[0-9\-\s\(\)]+$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },
  address: { type: String, required: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  pincode: { type: String, trim: true },
  dateOfBirth: { type: Date, required: true },
  gender: { 
    type: String, 
    required: true, 
    enum: ['Male', 'Female', 'Other'] 
  },
  employeeId: { type: String, required: true, unique: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['health_worker', 'supervisor', 'admin', 'data_entry'],
    default: 'health_worker'
  },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  photo: { type: String, default: null }, // Base64 or URL
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  currentOTP: {
    code: { type: String },
    expiresAt: { type: Date },
    attempts: { type: Number, default: 0 }
  },
  createdBy: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for better performance
userSchema.index({ uinNumber: 1 });
userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ role: 1, isActive: 1 });

const User = mongoose.model('User', userSchema);

// Create default test user (run once)
const createDefaultUser = async () => {
  try {
    const existingUser = await User.findOne({ uinNumber: '1234567890' });
    if (!existingUser) {
      const defaultUser = new User({
        uinNumber: '1234567890',
        name: 'ARITRADITYA ROY',
        firstName: 'ARITRADITYA',
        lastName: 'ROY',
        email: 'aritraditya.roy@gmail.com',
        phone: '+91-9876543210',
        address: '123 Main Street, New Delhi, Delhi 110001',
        dateOfBirth: new Date('1985-06-15'),
        gender: 'Male',
        employeeId: 'HW-567890',
        role: 'health_worker',
        department: 'Child Health Services',
        designation: 'Senior Health Worker',
        isActive: true
      });
      
      await defaultUser.save();
      console.log('✅ Default test user created with UIN: 1234567890');
    } else {
      console.log('ℹ️ Default test user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating default user:', error);
  }
};

// Function to clean up problematic indexes
const cleanupIndexes = async () => {
  try {
    // Try to drop the problematic uni index if it exists
    const indexes = await User.collection.listIndexes().toArray();
    const uniIndex = indexes.find(index => index.name === 'uni_1');
    
    if (uniIndex) {
      await User.collection.dropIndex('uni_1');
      console.log('✅ Dropped problematic uni index');
    }
  } catch (error) {
    console.log('ℹ️ No uni index to drop (this is expected)');
  }
};

// Call createDefaultUser after MongoDB connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB Atlas');
  await cleanupIndexes();
  await createDefaultUser();
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});
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

// Authentication endpoints
// Verify UIN number and get user data
app.post('/api/auth/verify-uin', async (req, res) => {
  try {
    const { uinNumber } = req.body;
    
    // Validate UIN format
    if (!uinNumber) {
      return res.status(400).json({
        success: false,
        message: 'UIN Number is required'
      });
    }
    
    if (!/^\d{10}$/.test(uinNumber)) {
      return res.status(400).json({
        success: false,
        message: 'UIN Number must be exactly 10 digits'
      });
    }
    
    // Check if user exists in database
    const user = await User.findOne({ 
      uinNumber: uinNumber,
      isActive: true 
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please contact administrator for access.',
        errorCode: 'USER_NOT_FOUND'
      });
    }
    
    // Update last login timestamp without triggering validation
    await User.findOneAndUpdate(
      { uinNumber: uinNumber },
      { lastLogin: new Date() },
      { new: false }
    );
    
    // Return user data (excluding sensitive fields)
    const userData = {
      uinNumber: user.uinNumber,
      uin: user.uinNumber, // For compatibility
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      employeeId: user.employeeId,
      role: user.role,
      department: user.department,
      designation: user.designation,
      photo: user.photo,
      isActive: user.isActive,
      lastLogin: user.lastLogin
    };
    
    console.log(`✅ User authenticated: ${user.name} (${user.uinNumber})`);
    
    res.status(200).json({
      success: true,
      message: 'User verified successfully',
      data: userData,
      token: `verified-${user.uinNumber}-${Date.now()}` // Simple token for session
    });
    
  } catch (error) {
    console.error('Error verifying UIN:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during verification',
      error: error.message
    });
  }
});

// Get user profile by UIN
app.get('/api/auth/profile/:uin', async (req, res) => {
  try {
    const { uin } = req.params;
    
    const user = await User.findOne({ 
      uinNumber: uin,
      isActive: true 
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Return user data (excluding sensitive fields)
    const userData = {
      uinNumber: user.uinNumber,
      uin: user.uinNumber,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      employeeId: user.employeeId,
      role: user.role,
      department: user.department,
      designation: user.designation,
      photo: user.photo,
      isActive: user.isActive,
      lastLogin: user.lastLogin
    };
    
    res.status(200).json({
      success: true,
      data: userData
    });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
});

// Create new user (admin endpoint)
app.post('/api/auth/users', async (req, res) => {
  try {
    const userData = req.body;
    
    // Validate required fields
    const requiredFields = [
      'uinNumber', 'name', 'firstName', 'lastName', 'email', 
      'phone', 'address', 'dateOfBirth', 'gender', 'employeeId', 
      'role', 'department', 'designation'
    ];
    
    const missingFields = requiredFields.filter(field => !userData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields: missingFields
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { uinNumber: userData.uinNumber },
        { email: userData.email },
        { employeeId: userData.employeeId }
      ]
    });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this UIN, email, or employee ID'
      });
    }
    
    // Create new user
    const newUser = new User(userData);
    const savedUser = await newUser.save();
    
    console.log(`✅ New user created: ${savedUser.name} (${savedUser.uinNumber})`);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        uinNumber: savedUser.uinNumber,
        name: savedUser.name,
        email: savedUser.email,
        employeeId: savedUser.employeeId,
        role: savedUser.role
      }
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

// Get all users (admin endpoint)
app.get('/api/auth/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, role, isActive } = req.query;
    
    // Build query
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    // Execute query with pagination
    const users = await User.find(query)
      .select('-__v') // Exclude version field
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total: total
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Bulk create sample users (development endpoint)
app.post('/api/auth/users/sample', async (req, res) => {
  try {
    const sampleUsers = [
      {
        uinNumber: '1234567890',
        name: 'ARITRADITYA ROY',
        firstName: 'ARITRADITYA',
        lastName: 'ROY',
        email: 'aritraditya.roy@gmail.com',
        phone: '+91-9876543210',
        address: '123 Main Street, New Delhi, Delhi 110001',
        dateOfBirth: new Date('1985-06-15'),
        gender: 'Male',
        employeeId: 'HW-567890',
        role: 'health_worker',
        department: 'Child Health Services',
        designation: 'Senior Health Worker'
      },
      {
        uinNumber: '9876543210',
        name: 'PRIYA SHARMA',
        firstName: 'PRIYA',
        lastName: 'SHARMA',
        email: 'priya.sharma@healthcare.gov.in',
        phone: '+91-9876543211',
        address: '456 Healthcare Avenue, Mumbai, Maharashtra 400001',
        dateOfBirth: new Date('1990-03-22'),
        gender: 'Female',
        employeeId: 'HW-123456',
        role: 'supervisor',
        department: 'Child Health Services',
        designation: 'Health Supervisor'
      },
      {
        uinNumber: '5555555555',
        name: 'RAJESH KUMAR',
        firstName: 'RAJESH',
        lastName: 'KUMAR',
        email: 'rajesh.kumar@health.gov.in',
        phone: '+91-9876543212',
        address: '789 Medical Complex, Bangalore, Karnataka 560001',
        dateOfBirth: new Date('1988-07-10'),
        gender: 'Male',
        employeeId: 'HW-789012',
        role: 'health_worker',
        department: 'Child Health Services',
        designation: 'Health Worker'
      }
    ];

    const results = {
      created: [],
      existing: [],
      failed: []
    };

    for (const userData of sampleUsers) {
      try {
        const existingUser = await User.findOne({ uinNumber: userData.uinNumber });
        if (existingUser) {
          results.existing.push(userData.uinNumber);
          continue;
        }

        const newUser = new User(userData);
        const savedUser = await newUser.save();
        results.created.push({
          uinNumber: savedUser.uinNumber,
          name: savedUser.name,
          role: savedUser.role
        });
      } catch (error) {
        results.failed.push({
          uinNumber: userData.uinNumber,
          error: error.message
        });
      }
    }

    console.log(`📊 Sample users creation: ${results.created.length} created, ${results.existing.length} existing, ${results.failed.length} failed`);

    res.status(200).json({
      success: true,
      message: `Sample users processed: ${results.created.length} created, ${results.existing.length} already exist`,
      data: results
    });

  } catch (error) {
    console.error('Error creating sample users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sample users',
      error: error.message
    });
  }
});

// Update user (admin endpoint)
app.put('/api/auth/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    
    // Update timestamp
    updateData.updatedAt = new Date();
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`✅ User updated: ${updatedUser.name} (${updatedUser.uinNumber})`);
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// Delete user (admin endpoint)
app.delete('/api/auth/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedUser = await User.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`🗑️ User deleted: ${deletedUser.name} (${deletedUser.uinNumber})`);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {
        deletedUser: {
          id: deletedUser._id,
          name: deletedUser.name,
          uinNumber: deletedUser.uinNumber
        }
      }
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// Get specific user by ID (admin endpoint)
app.get('/api/auth/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-__v');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// Update user verification status (admin endpoint)
app.patch('/api/auth/users/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isVerified: isVerified, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`✅ User verification updated: ${updatedUser.name} - ${isVerified ? 'Verified' : 'Unverified'}`);
    
    res.status(200).json({
      success: true,
      message: `User ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: updatedUser
    });
    
  } catch (error) {
    console.error('Error updating user verification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user verification',
      error: error.message
    });
  }
});

// Update user active status (admin endpoint)
app.patch('/api/auth/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isActive: isActive, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`✅ User status updated: ${updatedUser.name} - ${isActive ? 'Active' : 'Inactive'}`);
    
    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser
    });
    
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
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
      // Update existing record instead of failing
      const updatedRecord = await ChildHealthRecord.findOneAndUpdate(
        { healthId: req.body.healthId },
        { 
          ...req.body,
          updatedAt: new Date()
        },
        { new: true }
      );
      
      console.log(`🔄 Updated existing child record: ${updatedRecord.healthId} by ${updatedRecord.uploadedBy}`);
      
      return res.status(200).json({
        success: true,
        message: 'Child record updated successfully',
        data: updatedRecord,
        _updateType: 'updated'
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
          // Instead of failing, update the existing record with new data
          const updatedRecord = await ChildHealthRecord.findOneAndUpdate(
            { healthId: record.healthId },
            { 
              ...record,
              updatedAt: new Date()
            },
            { new: true }
          );
          results.successful.push({
            ...updatedRecord.toObject(),
            _updateType: 'updated' // Mark as updated instead of created
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

// User Management Routes
// Get all users with optional filtering
app.get('/api/users', async (req, res) => {
  try {
    const { role, isVerified } = req.query;
    let filter = {};
    
    if (role) filter.role = role;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Create new user
app.post('/api/users', async (req, res) => {
  try {
    const { uinNumber, name, firstName, lastName, email, phone, address, dateOfBirth, gender, employeeId, role, department, designation, isVerified } = req.body;
    
    // Check if UIN already exists
    const existingUser = await User.findOne({ uinNumber });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this UIN already exists'
      });
    }
    
    // Check if employee ID already exists
    const existingEmployee = await User.findOne({ employeeId });
    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: 'User with this Employee ID already exists'
      });
    }
    
    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    const newUser = new User({
      uinNumber,
      name,
      firstName,
      lastName,
      email,
      phone,
      address,
      dateOfBirth,
      gender,
      employeeId,
      role: role || 'health_worker',
      department,
      designation,
      isActive: true,
      isVerified: isVerified || false
    });
    
    const savedUser = await newUser.save();
    console.log('✅ New user created:', savedUser.name, '- UIN:', savedUser.uinNumber);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: savedUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle specific duplicate key errors with meaningful messages
    if (error.code === 11000) {
      let field = 'field';
      let message = 'A user with this information already exists';
      
      if (error.message.includes('uinNumber')) {
        field = 'UIN Number';
        message = 'A user with this UIN Number already exists';
      } else if (error.message.includes('email')) {
        field = 'email';
        message = 'A user with this email already exists';
      } else if (error.message.includes('employeeId')) {
        field = 'Employee ID';
        message = 'A user with this Employee ID already exists';
      }
      
      return res.status(409).json({
        success: false,
        message: message,
        field: field
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    });
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ User updated:', updatedUser.name);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedUser = await User.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ User deleted:', deletedUser.name);
    
    res.json({
      success: true,
      message: 'User deleted successfully',
      data: deletedUser
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// Update user verification status
app.patch('/api/users/:id/verification', async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      { isVerified }, 
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`✅ User verification ${isVerified ? 'approved' : 'rejected'}:`, updatedUser.name);
    
    res.json({
      success: true,
      message: `User ${isVerified ? 'approved' : 'rejected'} successfully`,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user verification:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user verification',
      error: error.message
    });
  }
});

// Update user status (for more general status updates)
app.patch('/api/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ User status updated:', updatedUser.name, '- New status:', status);
    
    res.json({
      success: true,
      message: 'User status updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
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
