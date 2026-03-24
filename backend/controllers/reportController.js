const Report = require('../models/Report');

// Create a new report
const createReport = async (req, res) => {
    try {
        console.log('createReport called');
        console.log('Request body:', req.body);
        console.log('User ID:', req.userId);

        const { targetType, targetId, reason, description, screenshotUrls } = req.body;

        if (!targetType || !targetId || !reason) {
            return res.status(400).json({ 
                message: 'Missing required fields' 
            });
        }

        let targetModel;
        if (targetType === 'post') targetModel = 'Post';
        else if (targetType === 'comment') targetModel = 'Comment';
        else if (targetType === 'user') targetModel = 'User';
        else {
            return res.status(400).json({ message: 'Invalid target type' });
        }

        const report = new Report({
            reporter: req.userId,
            targetType,
            targetId,
            targetModel,
            reason,
            description: description || '',
            screenshotUrls: screenshotUrls || [],
            auditLog: [{
                action: 'created',
                performedBy: req.userId,
                details: { reason, targetType, targetId }
            }]
        });

        const savedReport = await report.save();
        
        console.log('✅ Report saved! ID:', savedReport._id);

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully',
            data: savedReport
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
};

const getAllReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('reporter', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: reports });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMyReports = async (req, res) => {
    try {
        const reports = await Report.find({ reporter: req.userId })
            .sort({ createdAt: -1 });
        res.json({ success: true, data: reports });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('reporter', 'name email');
        
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateReportStatus = async (req, res) => {
    try {
        const { status, actionTaken, message } = req.body;
        const report = await Report.findById(req.params.id);
        
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        report.status = status;
        report.adminResponse = {
            actionTaken,
            message,
            resolvedBy: req.userId,
            resolvedAt: new Date()
        };
        
        await report.save();
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        
        await report.deleteOne();
        res.json({ success: true, message: 'Report deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getReportStats = async (req, res) => {
    try {
        const total = await Report.countDocuments();
        const pending = await Report.countDocuments({ status: 'pending' });
        const resolved = await Report.countDocuments({ status: 'resolved' });
        
        res.json({ 
            success: true, 
            data: { total, pending, resolved } 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
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