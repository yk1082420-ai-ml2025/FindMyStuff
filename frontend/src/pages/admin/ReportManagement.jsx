import { useState, useEffect } from 'react';
import { getReports, updateReport } from '../../api/report';
import { Shield, CheckCircle, AlertCircle, Clock, Search, XCircle, MoreVertical } from 'lucide-react';

const ReportManagement = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const query = statusFilter ? `?status=${statusFilter}` : '';
      const data = await getReports(query);
      setReports(data || []);
    } catch (error) {
      setMessage({ text: 'Failed to load reports', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId, newStatus) => {
    try {
      const payload = { status: newStatus };
      if (adminNotes) payload.adminNotes = adminNotes;
      
      await updateReport(reportId, payload);
      setMessage({ text: `Report marked as ${newStatus}`, type: 'success' });
      setSelectedReport(null);
      setAdminNotes('');
      fetchReports();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ text: 'Failed to update report', type: 'error' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-lg flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      case 'REVIEWING':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg flex items-center gap-1"><Search className="w-3 h-3" /> Reviewing</span>;
      case 'RESOLVED':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-lg flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Resolved</span>;
      case 'DISMISSED':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg flex items-center gap-1"><XCircle className="w-3 h-3" /> Dismissed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-surface-dark">Moderation Reports</h2>
          <p className="text-sm text-gray-500 mt-1">Review and manage user reports about suspicious activity</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="REVIEWING">Reviewing</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-surface-dark">No reports found</h3>
          <p className="text-gray-500 mt-1">Your community is looking safe right now.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <div key={report._id} className="bg-white p-5 border border-gray-200 rounded-2xl flex flex-col sm:flex-row justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{report.targetType} REPORT</span>
                  {getStatusBadge(report.status)}
                </div>
                <h4 className="font-semibold text-surface-dark flex items-center gap-2">
                  <span className="text-danger-500 bg-danger-50 px-2 py-0.5 rounded text-xs">{report.reason}</span>
                </h4>
                <p className="text-sm text-gray-600">{report.description || 'No description provided.'}</p>
                <div className="text-xs text-gray-400 flex items-center gap-2 mt-2">
                  <span>Reported by: {report.reporterId?.fullName || 'Unknown'}</span>
                  <span>•</span>
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Target ID: {report.targetId}</span>
                </div>
                {report.adminNotes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm border border-gray-100">
                    <span className="font-medium text-gray-700">Admin Notes: </span>
                    <span className="text-gray-600">{report.adminNotes}</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2 shrink-0 sm:w-48">
                {report.status !== 'RESOLVED' && report.status !== 'DISMISSED' ? (
                  <>
                    <button 
                      onClick={() => { setSelectedReport(report); setAdminNotes(report.adminNotes || ''); }}
                      className="px-4 py-2 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors"
                    >
                      Take Action
                    </button>
                  </>
                ) : (
                  <div className="text-xs text-gray-500 text-right">
                    Processed by {report.resolvedBy?.fullName || 'Admin'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-surface-dark mb-4">Take Action</h3>
            <p className="text-sm text-gray-500 mb-4">Add notes about your investigation and update the status.</p>
            
            <textarea
              className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-4 text-sm focus:outline-primary-500 focus:ring-2"
              rows="3"
              placeholder="Admin notes (e.g., 'User banned for 3 days', 'False alarm')"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            ></textarea>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button 
                onClick={() => handleResolve(selectedReport._id, 'RESOLVED')}
                className="py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Mark Resolved
              </button>
              <button 
                onClick={() => handleResolve(selectedReport._id, 'DISMISSED')}
                className="py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-medium transition-colors"
              >
                Dismiss Report
              </button>
            </div>
            <button 
              onClick={() => setSelectedReport(null)}
              className="w-full py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagement;
