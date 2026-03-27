// frontend/src/components/MyReports.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Flag, Clock, CheckCircle, AlertCircle, Eye, ChevronRight, X } from 'lucide-react';

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/reports/my-reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: Clock, 
        label: 'Pending Review' 
      },
      reviewing: { 
        color: 'bg-blue-100 text-blue-800', 
        icon: AlertCircle, 
        label: 'Under Review' 
      },
      resolved: { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle, 
        label: 'Resolved' 
      },
      dismissed: { 
        color: 'bg-red-100 text-red-800', 
        icon: X, 
        label: 'Dismissed' 
      }
    };
    return badges[status] || badges.pending;
  };

  const getReasonLabel = (reason) => {
    const reasons = {
      spam: 'Spam',
      harassment: 'Harassment',
      hate_speech: 'Hate Speech',
      false_claim: 'False Claim',
      misinformation: 'Misinformation',
      inappropriate_content: 'Inappropriate Content',
      other: 'Other'
    };
    return reasons[reason] || reason;
  };

  const getTargetIcon = (targetType) => {
    switch(targetType) {
      case 'post':
        return '📝';
      case 'comment':
        return '💬';
      case 'user':
        return '👤';
      default:
        return '📌';
    }
  };

  const filteredReports = filterStatus === 'all' 
    ? reports 
    : reports.filter(report => report.status === filterStatus);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Flag className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No reports yet</h3>
        <p className="text-gray-500 text-sm">
          You haven't submitted any reports. If you see inappropriate content, use the report button.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {/* Filter Bar */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('reviewing')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'reviewing'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Under Review
          </button>
          <button
            onClick={() => setFilterStatus('resolved')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'resolved'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Resolved
          </button>
          <button
            onClick={() => setFilterStatus('dismissed')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'dismissed'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Dismissed
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="divide-y divide-gray-100">
        {filteredReports.map(report => {
          const StatusBadge = getStatusBadge(report.status);
          const StatusIcon = StatusBadge.icon;
          
          return (
            <div
              key={report._id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{getTargetIcon(report.targetType)}</span>
                    <span className="text-sm font-medium text-gray-600">
                      {report.targetType.charAt(0).toUpperCase() + report.targetType.slice(1)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {getReasonLabel(report.reason)}
                    </span>
                  </div>
                  
                  {report.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {report.description}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${StatusBadge.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {StatusBadge.label}
                  </div>
                  <button className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1">
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Report Details</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Report Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Report Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Report ID:</span>
                    <span className="text-sm font-mono text-gray-700">{selectedReport._id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Status:</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedReport.status).color}`}>
                      {selectedReport.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Submitted:</span>
                    <span className="text-sm text-gray-700">
                      {new Date(selectedReport.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Reason:</span>
                    <span className="text-sm text-gray-700">{getReasonLabel(selectedReport.reason)}</span>
                  </div>
                  {selectedReport.description && (
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">Description:</span>
                      <p className="text-sm text-gray-700">{selectedReport.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Screenshots */}
              {selectedReport.screenshotUrls?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Screenshots</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedReport.screenshotUrls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Screenshot ${index + 1}`}
                        className="rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(url, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Response */}
              {selectedReport.adminResponse?.message && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Admin Response</h4>
                  <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-2">{selectedReport.adminResponse.message}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      Action taken: <span className="font-medium">{selectedReport.adminResponse.actionTaken}</span>
                      {selectedReport.adminResponse.resolvedBy && (
                        <> • Resolved by: {selectedReport.adminResponse.resolvedBy.name}</>
                      )}
                      {selectedReport.adminResponse.resolvedAt && (
                        <> • {new Date(selectedReport.adminResponse.resolvedAt).toLocaleString()}</>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReports;