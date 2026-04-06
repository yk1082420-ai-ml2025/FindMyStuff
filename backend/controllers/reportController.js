const Report = require('../models/Report');
const path = require('path');

// Create a new report (with optional screenshot uploads)
const createReport = async (req, res) => {
    try {
        const { targetType, targetId, reason, description } = req.body;

        if (!targetType || !targetId || !reason) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        let targetModel;
        if (targetType === 'post') targetModel = 'Post';
        else if (targetType === 'claim') targetModel = 'Claim';
        else if (targetType === 'user') targetModel = 'User';
        else return res.status(400).json({ success: false, message: 'Invalid target type' });

        // Handle uploaded screenshot files
        const screenshotUrls = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

        const report = await Report.create({
            reporter: req.user._id,
            targetType,
            targetId,
            targetModel,
            reason,
            description: description || '',
            screenshotUrls,
            auditLog: [{
                action: 'created',
                performedBy: req.user._id,
                details: { reason, targetType, targetId }
            }]
        });

        res.status(201).json({ success: true, message: 'Report submitted successfully', data: report });
    } catch (error) {
        console.error('createReport error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all reports – admin only (paginated)
const getAllReports = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.reason) filter.reason = req.query.reason;

        const [reports, total] = await Promise.all([
            Report.find(filter)
                .populate('reporter', 'fullName email studentId')
                .populate('adminResponse.resolvedBy', 'fullName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Report.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: reports,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get reports submitted by the current user
const getMyReports = async (req, res) => {
    try {
        const reports = await Report.find({ reporter: req.user._id })
            .populate('adminResponse.resolvedBy', 'fullName')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: reports });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get a single report by ID
const getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('reporter', 'fullName email studentId')
            .populate('adminResponse.resolvedBy', 'fullName');

        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

        // Only reporter or admin can view
        const isReporter = report.reporter._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        if (!isReporter && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update report status & admin response (admin only)
const updateReportStatus = async (req, res) => {
    try {
        const { status, actionTaken, message } = req.body;
        const report = await Report.findById(req.params.id);

        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

        report.status = status || report.status;
        report.adminResponse = {
            actionTaken: actionTaken || null,
            message: message || '',
            resolvedBy: req.user._id,
            resolvedAt: new Date()
        };

        report.auditLog.push({
            action: 'admin_responded',
            performedBy: req.user._id,
            details: { status, actionTaken, message }
        });

        await report.save();

        const populated = await Report.findById(report._id)
            .populate('reporter', 'fullName email studentId')
            .populate('adminResponse.resolvedBy', 'fullName');

        res.json({ success: true, data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a report (admin only)
const deleteReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
        await report.deleteOne();
        res.json({ success: true, message: 'Report deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get report stats (admin only)
const getReportStats = async (req, res) => {
    try {
        const [total, pending, reviewing, resolved, dismissed] = await Promise.all([
            Report.countDocuments(),
            Report.countDocuments({ status: 'pending' }),
            Report.countDocuments({ status: 'reviewing' }),
            Report.countDocuments({ status: 'resolved' }),
            Report.countDocuments({ status: 'dismissed' }),
        ]);
        res.json({ success: true, data: { total, pending, reviewing, resolved, dismissed } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createReport,
    getAllReports,
    getMyReports,
    getReportById,
    updateReportStatus,
    deleteReport,
    getReportStats
};