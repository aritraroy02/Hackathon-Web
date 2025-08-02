/**
 * Children Routes - Backend
 */

import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createChild,
  getAllChildren,
  getChildrenBySubmitter,
  getChildById,
  getChildByHealthId,
  updateChild,
  deleteChild,
  syncOfflineRecords,
  getStatistics
} from '../controllers/childrenController.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const createChildValidation = [
  body('childName')
    .isLength({ min: 2 })
    .withMessage('Child name must be at least 2 characters long')
    .trim(),
  body('age')
    .isInt({ min: 0, max: 18 })
    .withMessage('Age must be between 0 and 18'),
  body('weight')
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number'),
  body('height')
    .isFloat({ min: 0 })
    .withMessage('Height must be a positive number'),
  body('guardianName')
    .isLength({ min: 2 })
    .withMessage('Guardian name must be at least 2 characters long')
    .trim(),
  body('parentalConsent')
    .isBoolean()
    .withMessage('Parental consent must be true or false'),
  body('submittedBy')
    .notEmpty()
    .withMessage('Submitted by is required'),
  body('submitterName')
    .isLength({ min: 2 })
    .withMessage('Submitter name must be at least 2 characters long')
    .trim()
];

const updateChildValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid child ID'),
  body('childName')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Child name must be at least 2 characters long')
    .trim(),
  body('age')
    .optional()
    .isInt({ min: 0, max: 18 })
    .withMessage('Age must be between 0 and 18'),
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number'),
  body('height')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Height must be a positive number'),
  body('guardianName')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Guardian name must be at least 2 characters long')
    .trim()
];

const getChildByIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid child ID')
];

const getChildByHealthIdValidation = [
  param('healthId')
    .isLength({ min: 5 })
    .withMessage('Invalid health ID')
];

const getChildrenBySubmitterValidation = [
  param('submitterId')
    .notEmpty()
    .withMessage('Submitter ID is required'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const syncRecordsValidation = [
  body('records')
    .isArray()
    .withMessage('Records must be an array'),
  body('records.*.childName')
    .isLength({ min: 2 })
    .withMessage('Child name must be at least 2 characters long'),
  body('records.*.age')
    .isInt({ min: 0, max: 18 })
    .withMessage('Age must be between 0 and 18'),
  body('records.*.weight')
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number'),
  body('records.*.height')
    .isFloat({ min: 0 })
    .withMessage('Height must be a positive number'),
  body('records.*.guardianName')
    .isLength({ min: 2 })
    .withMessage('Guardian name must be at least 2 characters long'),
  body('records.*.parentalConsent')
    .isBoolean()
    .withMessage('Parental consent must be true or false')
];

// Routes
router.post('/', createChildValidation, validateRequest, createChild);
router.get('/', getAllChildren);
router.get('/stats', getStatistics);
router.get('/submitter/:submitterId', getChildrenBySubmitterValidation, validateRequest, getChildrenBySubmitter);
router.get('/health-id/:healthId', getChildByHealthIdValidation, validateRequest, getChildByHealthId);
router.get('/:id', getChildByIdValidation, validateRequest, getChildById);
router.put('/:id', updateChildValidation, validateRequest, updateChild);
router.delete('/:id', getChildByIdValidation, validateRequest, deleteChild);
router.post('/sync', syncRecordsValidation, validateRequest, syncOfflineRecords);

export default router;
