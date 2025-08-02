/**
 * Authentication Controller - Backend
 */

import { User } from '../models/index.js';

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Mock phone number masking
 */
const maskPhoneNumber = (phone) => {
  if (!phone || phone.length < 4) return 'XXXX';
  return 'XXXXXXX' + phone.slice(-3);
};

/**
 * Request OTP for authentication
 */
export const requestOtp = async (req, res) => {
  try {
    const { nationalId } = req.body;

    if (!nationalId || nationalId.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Valid National ID is required'
      });
    }

    // Find or create user
    let user = await User.findByNationalId(nationalId);
    
    if (!user) {
      // For demo purposes, create a new user if not found
      // In production, this would be pre-registered users only
      user = new User({
        nationalId,
        name: `User ${nationalId.slice(-4)}`, // Demo name
        phone: `+91${nationalId.slice(-10)}`, // Demo phone
        role: 'health_worker',
        isActive: true
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Update user with OTP
    user.currentOtp = otp;
    user.otpExpiresAt = expiresAt;
    user.otpAttempts = 0;

    await user.save();

    console.log(`OTP for ${nationalId}: ${otp}`); // For demo - remove in production

    res.json({
      success: true,
      message: 'OTP sent successfully',
      maskedPhone: maskPhoneNumber(user.phone),
      otp: otp // For demo purposes only - remove in production
    });

  } catch (error) {
    console.error('OTP request failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.'
    });
  }
};

/**
 * Verify OTP and authenticate user
 */
export const verifyOtp = async (req, res) => {
  try {
    const { nationalId, otp } = req.body;

    if (!nationalId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'National ID and OTP are required'
      });
    }

    // Find user
    const user = await User.findByNationalId(nationalId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if OTP exists and hasn't expired
    if (!user.currentOtp || new Date() > user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Check OTP attempts
    if (user.otpAttempts >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (user.currentOtp !== otp) {
      user.otpAttempts += 1;
      await user.save();
      
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    // Success - clear OTP and update last login
    user.currentOtp = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    user.lastLogin = new Date();
    
    await user.save();

    // Create user token (simplified for demo)
    const token = `token_${user._id}_${Date.now()}`;

    res.json({
      success: true,
      message: 'Authentication successful',
      user: user.toJSON(),
      token
    });

  } catch (error) {
    console.error('OTP verification failed:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.'
    });
  }
};

/**
 * Create a demo user for testing
 */
export const createDemoUser = async (req, res) => {
  try {
    const { nationalId, name, phone, email, role } = req.body;

    if (!nationalId) {
      return res.status(400).json({
        success: false,
        message: 'National ID is required'
      });
    }
    
    const existingUser = await User.findByNationalId(nationalId);
    if (existingUser) {
      return res.json({
        success: true,
        message: 'User already exists',
        user: existingUser.toJSON()
      });
    }
    
    const demoUser = new User({
      nationalId,
      name: name || `Demo User ${nationalId.slice(-4)}`,
      phone: phone || `+91${nationalId.slice(-10)}`,
      email: email || `demo${nationalId.slice(-4)}@example.com`,
      role: role || 'health_worker',
      isActive: true
    });
    
    await demoUser.save();
    
    res.status(201).json({
      success: true,
      message: 'Demo user created successfully',
      user: demoUser.toJSON()
    });
  } catch (error) {
    console.error('Failed to create demo user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create demo user'
    });
  }
};

const authController = {
  requestOtp,
  verifyOtp,
  createDemoUser
};

export default authController;
