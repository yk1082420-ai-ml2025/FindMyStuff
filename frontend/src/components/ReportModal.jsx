import { useState } from 'react';
import { createReport } from '../api/report';
import { ShieldAlert, X, AlertCircle } from 'lucide-react';

const ReportModal = ({ isOpen, onClose, targetId, targetType }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setMessage({ text: 'Please select a reason', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await createReport({
        targetId,
        targetType,
        reason,
        description
      });
      setMessage({ text: 'Report submitted successfully. Thank you for keeping our community safe!', type: 'success' });
      setTimeout(() => {
        onClose();
        setReason('');
        setDescription('');
        setMessage({ text: '', type: '' });
      }, 3000);
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || 'Failed to submit report. Please try again.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-red-50 px-6 py-4 flex items-center justify-between border-b border-red-100">
          <div className="flex items-center gap-2 text-danger-600">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-bold">Report this {targetType?.replace('POST_', '')?.toLowerCase() || 'item'}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            If you believe this {targetType?.replace('POST_', '')?.toLowerCase() || 'item'} violates our community guidelines, please report it. Our admins will review it shortly.
          </p>

          {message.text && (
            <div className={`mb-4 p-3 rounded-lg text-sm flex items-start gap-2 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{message.text}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-dark mb-1.5">
                Reason for reporting <span className="text-danger-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-primary-500 focus:bg-white transition-colors"
                disabled={loading || message.type === 'success'}
              >
                <option value="">Select a reason...</option>
                <option value="SPAM">Spam or Misleading</option>
                <option value="HARASSMENT">Harassment or Abuse</option>
                <option value="FALSE_INFO">False Information</option>
                <option value="INAPPROPRIATE_CONTENT">Inappropriate Content</option>
                <option value="SCAM">Scam or Fraud</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-dark mb-1.5">
                Additional Details (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide more context to help us understand..."
                rows="3"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-primary-500 focus:bg-white transition-colors resize-none"
                disabled={loading || message.type === 'success'}
              ></textarea>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-danger-500 text-white rounded-xl text-sm font-medium hover:bg-danger-600 transition-colors flex items-center justify-center"
                disabled={loading || message.type === 'success'}
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ReportModal;
