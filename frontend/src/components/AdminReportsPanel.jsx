// frontend/src/components/AdminReportsPanel.jsx
import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { Flag, CheckCircle, XCircle, Clock, AlertTriangle, Eye, User, FileText, MessageSquare } from 'lucide-react';
import MyReports from '../components/MyReports';

const AdminReportsPanel = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [stats, setStats] = useState(null);
  const [actionTaken, setActionTaken] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [filter]);

  const fetchReports = async () => {
    try {
      const { data } = await API.get(`/reports/admin/all?status=${filter}`);
      setReports(data.data || []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await API.get('/reports/admin/stats');
      setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleResolve = async (reportId) => {
    if (!actionTaken || !responseMessage) {
      alert('Please select action and provide a message');
      return;
    }
    
    try {
      await API.put(`/reports/admin/${reportId}`, {
        status: 'resolved',
        actionTaken,
        message: responseMessage
      });
      fetchReports();
      setSelectedReport(null);
      setActionTaken('');
      setResponseMessage('');
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert('Failed to resolve report');
    }
  };

  const handleDismiss = async (reportId) => {
    if (!responseMessage) {
      alert('Please provide a dismissal message');
      return;
    }
    
    try {
      await API.put(`/reports/admin/${reportId}`, {
        status: 'dismissed',
        actionTaken: 'no_action',
        message: responseMessage
      });
      fetchReports();
      setSelectedReport(null);
      setResponseMessage('');
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert('Failed to dismiss report');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getTargetIcon = (targetType) => {
    switch(targetType) {
      case 'post': return <FileText className="w-4 h-4" />;
      case 'comment': return <MessageSquare className="w-4 h-4" />;
      case 'user': return <User className="w-4 h-4" />;
      default: return <Flag className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
              </div>
              <Flag className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.statusStats?.find(s => s._id === 'pending')?.count || 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.statusStats?.find(s => s._id === 'resolved')?.count || 0}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Dismissed</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.statusStats?.find(s => s._id === 'dismissed')?.count || 0}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {['pending', 'reviewing', 'resolved', 'dismissed'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === status
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reporter</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Target</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map(report => (
                <tr key={report._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {report.reporter?.name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 flex items-center gap-1">
                    {getTargetIcon(report.targetType)}
                    {report.targetType}: {report.targetId.slice(-6)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                    {report.reason?.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Review Report</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Report Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Report Details</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><strong>Reporter:</strong> {selectedReport.reporter?.name} ({selectedReport.reporter?.email})</p>
                  <p><strong>Target Type:</strong> {selectedReport.targetType}</p>
                  <p><strong>Target ID:</strong> {selectedReport.targetId}</p>
                  <p><strong>Reason:</strong> {selectedReport.reason}</p>
                  {selectedReport.description && (
                    <p><strong>Description:</strong> {selectedReport.description}</p>
                  )}
                  <p><strong>Submitted:</strong> {new Date(selectedReport.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Screenshots */}
              {selectedReport.screenshotUrls?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Screenshots</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedReport.screenshotUrls.map((url, idx) => (
                      <img key={idx} src={url} alt="Screenshot" className="rounded-lg border border-gray-200" />
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Action */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Take Action</h4>
                <div className="space-y-4">
                  <select
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                  >
                    <option value="">Select action to take...</option>
                    <option value="warning">Issue Warning</option>
                    <option value="content_removed">Remove Content</option>
                    <option value="user_suspended">Suspend User (Temporary)</option>
                    <option value="user_banned">Ban User (Permanent)</option>
                    <option value="other">Other Action</option>
                  </select>
                  
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Enter message to user explaining the action taken..."
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                  />
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleResolve(selectedReport._id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Resolve Report
                    </button>
                    <button
                      onClick={() => handleDismiss(selectedReport._id)}
                      className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPanel;