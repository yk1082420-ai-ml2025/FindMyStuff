// frontend/src/services/reportService.js
import api from './api';

const reportService = {
    // Create report - matches backend field names
    createReport: async (reportData) => {
        try {
            const payload = {
                targetType: reportData.targetType,     // 'post', 'comment', 'user'
                targetId: reportData.targetId,          // ID of the reported item
                reason: reportData.reason,              // spam, harassment, etc.
                description: reportData.description,    // Optional details
                screenshotUrls: reportData.screenshotUrls || []  // Array of image URLs
            };
            
            const response = await api.post('/reports', payload);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getMyReports: async () => {
        try {
            const response = await api.get('/reports/my-reports');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getReportById: async (reportId) => {
        try {
            const response = await api.get(`/reports/${reportId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Admin endpoints
    getAllReports: async (params = {}) => {
        try {
            const queryParams = new URLSearchParams(params).toString();
            const response = await api.get(`/reports/admin/all${queryParams ? `?${queryParams}` : ''}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getReportStats: async () => {
        try {
            const response = await api.get('/reports/admin/stats');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    updateReportStatus: async (reportId, statusData) => {
        try {
            const response = await api.put(`/reports/admin/${reportId}`, statusData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    deleteReport: async (reportId) => {
        try {
            const response = await api.delete(`/reports/admin/${reportId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default reportService;