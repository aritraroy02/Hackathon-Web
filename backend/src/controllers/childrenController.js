/**
 * Children Controller - Backend
 */

import { Child } from '../models/index.js';

/**
 * Create a new child record
 */
export const createChild = async (req, res) => {
  try {
    const childData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
      isOfflineRecord: false
    };

    const child = new Child(childData);
    const savedChild = await child.save();

    res.status(201).json({
      success: true,
      message: 'Child record created successfully',
      data: savedChild
    });

  } catch (error) {
    console.error('Failed to create child record:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Child record with this Health ID already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create child record'
    });
  }
};

/**
 * Get all child records
 */
export const getAllChildren = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    const children = await Child.find()
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .exec();

    const total = await Child.countDocuments();

    res.json({
      success: true,
      data: children,
      pagination: {
        currentPage: options.page,
        totalPages: Math.ceil(total / options.limit),
        totalRecords: total,
        hasNextPage: options.page < Math.ceil(total / options.limit),
        hasPrevPage: options.page > 1
      }
    });

  } catch (error) {
    console.error('Failed to get children records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve child records'
    });
  }
};

/**
 * Get child records by submitter
 */
export const getChildrenBySubmitter = async (req, res) => {
  try {
    const { submitterId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const children = await Child.find({ submittedBy: submitterId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Child.countDocuments({ submittedBy: submitterId });

    res.json({
      success: true,
      data: children,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total
      }
    });

  } catch (error) {
    console.error('Failed to get children by submitter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve child records'
    });
  }
};

/**
 * Get a single child record by ID
 */
export const getChildById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const child = await Child.findById(id);
    
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child record not found'
      });
    }

    res.json({
      success: true,
      data: child
    });

  } catch (error) {
    console.error('Failed to get child by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve child record'
    });
  }
};

/**
 * Get child record by Health ID
 */
export const getChildByHealthId = async (req, res) => {
  try {
    const { healthId } = req.params;
    
    const child = await Child.findOne({ healthId });
    
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child record not found'
      });
    }

    res.json({
      success: true,
      data: child
    });

  } catch (error) {
    console.error('Failed to get child by Health ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve child record'
    });
  }
};

/**
 * Update a child record
 */
export const updateChild = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    const child = await Child.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child record not found'
      });
    }

    res.json({
      success: true,
      message: 'Child record updated successfully',
      data: child
    });

  } catch (error) {
    console.error('Failed to update child record:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update child record'
    });
  }
};

/**
 * Delete a child record
 */
export const deleteChild = async (req, res) => {
  try {
    const { id } = req.params;
    
    const child = await Child.findByIdAndDelete(id);
    
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child record not found'
      });
    }

    res.json({
      success: true,
      message: 'Child record deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete child record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete child record'
    });
  }
};

/**
 * Sync offline records
 */
export const syncOfflineRecords = async (req, res) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'Records must be an array'
      });
    }

    const syncResults = [];

    for (const record of records) {
      try {
        const childData = {
          ...record,
          syncStatus: 'synced',
          isOfflineRecord: false,
          createdAt: new Date(record.createdAt),
          updatedAt: new Date()
        };

        const child = new Child(childData);
        const savedChild = await child.save();

        syncResults.push({
          localId: record.id,
          mongoId: savedChild._id.toString(),
          success: true
        });
      } catch (error) {
        console.error(`Failed to sync record ${record.id}:`, error);
        syncResults.push({
          localId: record.id,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Sync completed',
      results: syncResults
    });

  } catch (error) {
    console.error('Sync failed:', error);
    res.status(500).json({
      success: false,
      message: 'Sync failed'
    });
  }
};

/**
 * Get statistics
 */
export const getStatistics = async (req, res) => {
  try {
    const totalChildren = await Child.countDocuments();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayChildren = await Child.countDocuments({
      createdAt: { $gte: todayStart }
    });

    const stats = {
      totalChildren,
      todayChildren,
      averageAge: 0,
      malnutritionCases: 0
    };

    // Calculate average age
    const ageResult = await Child.aggregate([
      { $group: { _id: null, avgAge: { $avg: '$age' } } }
    ]);
    
    if (ageResult.length > 0) {
      stats.averageAge = Math.round(ageResult[0].avgAge * 10) / 10;
    }

    // Count malnutrition cases (children with malnutrition signs)
    stats.malnutritionCases = await Child.countDocuments({
      malnutritionSigns: { $exists: true, $not: { $size: 0 } }
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Failed to get statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics'
    });
  }
};

const childrenController = {
  createChild,
  getAllChildren,
  getChildrenBySubmitter,
  getChildById,
  getChildByHealthId,
  updateChild,
  deleteChild,
  syncOfflineRecords,
  getStatistics
};

export default childrenController;
