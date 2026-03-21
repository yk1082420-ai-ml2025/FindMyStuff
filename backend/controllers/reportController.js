const Report = require('../models/Report');
const User = require('../models/User');

// @desc    Submit a new report
// @route   POST /api/reports
// @access  Private
const createReport = async (req, res) => {
    try {
        const { targetId, targetType, reason, description } = req.body;
        const reporterId = req.user.id;

        // Prevent duplicate pending reports from the same user for the same target
        const existingReport = await Report.findOne({
            reporterId,
            targetId,
            status: { $in: ['PENDING', 'REVIEWING'] }
        });

        if (existingReport) {
            return res.status(400).json({
                success: false,
                message: 'You have already reported this item and it is currently being reviewed.'
            });
        }

        const report = await Report.create({
            reporterId,
            targetId,
            targetType,
            reason,
            description
        });

        res.status(201).json({
            success: true,
            data: report,
            message: 'Report submitted successfully. Admins will review it shortly.'
        });
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting report',
            error: error.message
        });
    }
};

// @desc    Get all reports (with filtering)
// @route   GET /api/reports
// @access  Private/Admin
const getReports = async (req, res) => {
    try {
        const { status, type } = req.query;
        let query = {};

        if (status) query.status = status;
        if (type) query.targetType = type;

        const reports = await Report.find(query)
            .populate('reporterId', 'fullName email')
            .populate('resolvedBy', 'fullName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reports',
            error: error.message
        });
    }
};

// @desc    Update report status or add admin notes
// @route   PUT /api/reports/:id
// @access  Private/Admin
const updateReport = async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const reportId = req.params.id;
        const adminId = req.user.id;

        const updateData = {};
        if (status) updateData.status = status;
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

        // If marking as resolved or dismissed, track who and when
        if (['RESOLVED', 'DISMISSED'].includes(status)) {
            updateData.resolvedBy = adminId;
            updateData.resolvedAt = new Date();
        }

        const report = await Report.findByIdAndUpdate(
            reportId,
            updateData,
            { new: true, runValidators: true }
        )
        .populate('reporterId', 'fullName email')
        .populate('resolvedBy', 'fullName');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        res.status(200).json({
            success: true,
            data: report,
            message: 'Report updated successfully'
        });
    } catch (error) {
        console.error('Update report error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating report',
            error: error.message
        });
    }
};

module.exports = {
    createReport,
    getReports,
    updateReport
};
