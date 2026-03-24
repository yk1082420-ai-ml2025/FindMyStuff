import React, { useState } from 'react';
import API from '../api/axios';
import { X, Flag, Upload, AlertCircle, CheckCircle } from 'lucide-react';

const ReportForm = ({ targetType, targetId, onClose, onReportSubmitted }) => {
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    screenshotUrls: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  const reasons = [
    { value: 'spam', label: 'Spam', icon: '📧' },
    { value: 'harassment', label: 'Harassment', icon: '😡' },
    { value: 'hate_speech', label: 'Hate Speech', icon: '⚠️' },
    { value: 'false_claim', label: 'False Claim', icon: '❌' },
    { value: 'misinformation', label: 'Misinformation', icon: '📢' },
    { value: 'inappropriate_content', label: 'Inappropriate Content', icon: '🔞' },
    { value: 'other', label: 'Other', icon: '📝' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleScreenshotUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        continue;
      }

      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await API.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setFormData(prev => ({
          ...prev,
          screenshotUrls: [...prev.screenshotUrls, response.data.url]
        }));
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        setError('Failed to upload screenshot');
      } finally {
        setUploading(false);
      }
    }
  };

  const removeScreenshot = (index) => {
    setFormData({
      ...formData,
      screenshotUrls: formData.screenshotUrls.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reason) {
      setError('Please select a reason for reporting');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await API.post('/reports', {
        targetType,
        targetId,
        reason: formData.reason,
        description: formData.description,
        screenshotUrls: formData.screenshotUrls
      });

      setSuccess('Report submitted successfully! Thank you for helping keep our community safe.');
      setTimeout(() => {
        if (onReportSubmitted) onReportSubmitted(response.data.data);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">Report Content</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for reporting *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {reasons.map((reason) => (
                <button
                  key={reason.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, reason: reason.value })}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                    formData.reason === reason.value
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span>{reason.icon}</span>
                  <span className="text-sm">{reason.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              placeholder="Provide more details about this report..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Screenshots (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-red-300 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleScreenshotUpload}
                className="hidden"
                id="screenshot-upload"
                disabled={uploading}
              />
              <label
                htmlFor="screenshot-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {uploading ? 'Uploading...' : 'Click to upload screenshots'}
                </span>
                <span className="text-xs text-gray-400">Max 5MB per file</span>
              </label>
            </div>
            
            {formData.screenshotUrls.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {formData.screenshotUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.reason}
              className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Flag className="w-4 h-4" />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;