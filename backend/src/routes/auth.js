/**
 * Authentication Routes - Backend
 */

import express from 'express';
import { body } from 'express-validator';
import { requestOtp, verifyOtp, createDemoUser } from '../controllers/authController.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const requestOtpValidation = [
  body('nationalId')
    .isLength({ min: 10 })
    .withMessage('National ID must be at least 10 characters long')
    .isNumeric()
    .withMessage('National ID must contain only numbers')
];

const verifyOtpValidation = [
  body('nationalId')
    .isLength({ min: 10 })
    .withMessage('National ID must be at least 10 characters long')
    .isNumeric()
    .withMessage('National ID must contain only numbers'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
];

const createUserValidation = [
  body('nationalId')
    .isLength({ min: 10 })
    .withMessage('National ID must be at least 10 characters long')
    .isNumeric()
    .withMessage('National ID must contain only numbers'),
  body('name')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Invalid phone number format'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('role')
    .optional()
    .isIn(['health_worker', 'supervisor', 'admin'])
    .withMessage('Invalid role')
];

// Routes
router.post('/request-otp', requestOtpValidation, validateRequest, requestOtp);
router.post('/verify-otp', verifyOtpValidation, validateRequest, verifyOtp);
router.post('/create-demo-user', createUserValidation, validateRequest, createDemoUser);

export default router;
