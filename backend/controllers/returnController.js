const Report = require('../models/Report');

// Create a new report
exports.createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, description, screenshotUrls } = req.body;

    // Validation
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Determine target model
    let targetModel;
    switch (targetType) {
      case 'post':
        targetModel = 'Post';
        break;
      case 'comment':
        targetModel = 'Comment';
        break;
      case 'user':
        targetModel = 'User';
        break;
      default:
        return res.status(400).json({ message: 'Invalid target type' });
    }

    const report = new Report({
      reporter: req.userId,
      targetType,
      targetId,
      targetModel,
      reason,
      description,
      screenshotUrls: screenshotUrls || [],
      auditLog: [{
        action: 'created',
        performedBy: req.userId,
        details: { reason, targetType, targetId }
      }]
    });

    await report.save();

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: report
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all reports (Admin only)
exports.getAllReports = async (req, res) => {
  try {
    const { status, targetType, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (targetType) filter.targetType = targetType;

    const reports = await Report.find(filter)
      .populate('reporter', 'name email')
      .populate('adminResponse.resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(filter);

    res.json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's own reports
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.userId })
      .sort({ createdAt: -1 })
      .populate('adminResponse.resolvedBy', 'name email');

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single report by ID
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporter', 'name email')
      .populate('adminResponse.resolvedBy', 'name email');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user is admin or the reporter
    if (req.user.role !== 'admin' && report.reporter._id.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update report status and add admin response (Admin only)
exports.updateReportStatus = async (req, res) => {
  try {
    const { status, actionTaken, message } = req.body;
    const reportId = req.params.id;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const updateData = {
      status,
      $push: {
        auditLog: {
          action: 'status_updated',
          performedBy: req.userId,
          details: { oldStatus: report.status, newStatus: status }
        }
      }
    };

    // If status is resolved or dismissed, add admin response
    if (status === 'resolved' || status === 'dismissed') {
      updateData.adminResponse = {
        actionTaken: actionTaken || (status === 'dismissed' ? 'no_action' : 'other'),
        message: message || '',
        resolvedBy: req.userId,
        resolvedAt: new Date()
      };
      
      updateData.$push.auditLog = {
        action: 'admin_responded',
        performedBy: req.userId,
        details: { actionTaken, message, status }
      };
    }

    const updatedReport = await Report.findByIdAndUpdate(
      reportId,
      updateData,
      { new: true, runValidators: true }
    ).populate('adminResponse.resolvedBy', 'name email');

    res.json({
      success: true,
      message: 'Report status updated successfully',
      data: updatedReport
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete report (Archive) - Admin only
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await report.remove();
    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get report statistics (Admin only)
exports.getReportStats = async (req, res) => {
  try {
    const stats = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const reasonStats = await Report.aggregate([
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        statusStats: stats,
        reasonStats: reasonStats,
        totalReports: await Report.countDocuments()
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};