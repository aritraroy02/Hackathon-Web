/**
 * Mongoose Models for the Child Health Application - Backend
 */

import mongoose from 'mongoose';

// Child Schema
const childSchema = new mongoose.Schema({
  healthId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  childName: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 0,
    max: 18
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  height: {
    type: Number,
    required: true,
    min: 0
  },
  guardianName: {
    type: String,
    required: true,
    trim: true
  },
  malnutritionSigns: [{
    type: String
  }],
  recentIllnesses: {
    type: String,
    trim: true
  },
  parentalConsent: {
    type: Boolean,
    required: true
  },
  photo: {
    type: String, // Base64 encoded image or file path
    default: null
  },
  location: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date
  },
  submittedBy: {
    type: String,
    required: true
  },
  submitterName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  syncStatus: {
    type: String,
    enum: ['pending', 'synced', 'failed'],
    default: 'synced'
  },
  isOfflineRecord: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'children'
});

// User Schema for Authentication
const userSchema = new mongoose.Schema({
  nationalId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['health_worker', 'supervisor', 'admin'],
    default: 'health_worker'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // For demo purposes - in production, store hashed passwords
  passwordHash: {
    type: String,
    required: false // Optional for demo with OTP-only auth
  },
  // OTP related fields
  currentOtp: {
    type: String,
    default: null
  },
  otpExpiresAt: {
    type: Date,
    default: null
  },
  otpAttempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for better performance
childSchema.index({ submittedBy: 1, createdAt: -1 });
childSchema.index({ healthId: 1 });
childSchema.index({ createdAt: -1 });
childSchema.index({ syncStatus: 1 });

userSchema.index({ nationalId: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });

// Instance methods
childSchema.methods.toJSON = function() {
  const child = this.toObject();
  // Remove sensitive data if needed
  return child;
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  // Remove sensitive data
  delete user.passwordHash;
  delete user.currentOtp;
  delete user.otpExpiresAt;
  delete user.otpAttempts;
  return user;
};

// Static methods
childSchema.statics.generateHealthId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `CH${timestamp}${random}`.toUpperCase();
};

userSchema.statics.findByNationalId = function(nationalId) {
  return this.findOne({ nationalId, isActive: true });
};

// Pre-save hooks
childSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (!this.healthId) {
    this.healthId = this.constructor.generateHealthId();
  }
  next();
});

userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create models
export const Child = mongoose.model('Child', childSchema);
export const User = mongoose.model('User', userSchema);

const models = { Child, User };
export default models;
