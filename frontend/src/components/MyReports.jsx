import { useState, useEffect } from 'react';
import API from '../api/axios';
import {
    Flag, Clock, CheckCircle, X, ChevronRight, ChevronDown, ChevronUp,
    Upload, AlertCircle, Plus, Shield, Eye
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_MAP = {
    pending:   { label: 'Pending Review',  cls: 'bg-amber-50 text-amber-700 border-amber-200',   icon: Clock },
    reviewing: { label: 'Under Review',    cls: 'bg-blue-50 text-blue-700 border-blue-200',      icon: Eye },
    resolved:  { label: 'Resolved',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
    dismissed: { label: 'Dismissed',       cls: 'bg-gray-50 text-gray-500 border-gray-200',      icon: X },
};

const REASON_LABELS = {
    spam: 'Spam',
    harassment: 'Harassment',
    hate_speech: 'Hate Speech',
    false_claim: 'False Claim',
    misinformation: 'Misinformation',
    inappropriate_content: 'Inappropriate Content',
    other: 'Other',
};

const ACTION_LABELS = {
    warning: 'Warning Issued',
    content_removed: 'Content Removed',
    user_suspended: 'User Suspended',
    user_banned: 'User Banned',
    no_action: 'No Action Taken',
    other: 'Other',
};

// ─── Submit Report Form ───────────────────────────────────────────────────────

const SubmitReportForm = ({ onSuccess, onCancel }) => {
    const [form, setForm] = useState({
        targetType: 'post',
        targetId: '',
        reason: 'spam',
        description: '',
    });
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFiles = (e) => {
        const selected = Array.from(e.target.files).slice(0, 5);
        setFiles(selected);
        setPreviews(selected.map(f => URL.createObjectURL(f)));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.targetId.trim()) {
            setError('Please provide the ID of the item, claim, or user you are reporting.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('targetType', form.targetType);
            fd.append('targetId', form.targetId.trim());
            fd.append('reason', form.reason);
            fd.append('description', form.description);
            files.forEach(f => fd.append('screenshots', f));
            await API.post('/reports', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputCls = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 focus:bg-white transition-all';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                            <Flag className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-800">Submit a Report</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Report suspicious or false content to admins</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                        </div>
                    )}

                    {/* Target Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">What are you reporting? <span className="text-red-400">*</span></label>
                        <select
                            value={form.targetType}
                            onChange={e => setForm(f => ({ ...f, targetType: e.target.value }))}
                            className={inputCls}
                        >
                            <option value="post">A Post (Lost/Found item)</option>
                            <option value="claim">A Claim</option>
                            <option value="user">A User</option>
                        </select>
                    </div>

                    {/* Target ID */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            {form.targetType === 'post' ? 'Post ID' : form.targetType === 'claim' ? 'Claim ID' : 'User ID'} <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.targetId}
                            onChange={e => setForm(f => ({ ...f, targetId: e.target.value }))}
                            placeholder={`Paste the ${form.targetType} ID here…`}
                            className={inputCls}
                            required
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            You can find the ID in the URL or listed in the post/claim details.
                        </p>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason <span className="text-red-400">*</span></label>
                        <select
                            value={form.reason}
                            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                            className={inputCls}
                        >
                            {Object.entries(REASON_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            rows={4}
                            maxLength={500}
                            placeholder="Describe the issue in detail…"
                            className={`${inputCls} resize-none`}
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/500</p>
                    </div>

                    {/* Screenshots */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Screenshots <span className="text-xs font-normal text-gray-400">(up to 5 images)</span></label>
                        <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition-all">
                            <Upload className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">Click to upload screenshots</span>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFiles} />
                        </label>
                        {previews.length > 0 && (
                            <div className="flex gap-2 mt-3 flex-wrap">
                                {previews.map((src, i) => (
                                    <img key={i} src={src} alt={`screenshot-${i}`} className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:from-red-600 hover:to-rose-600 transition-all shadow-md shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <Flag className="w-4 h-4" />
                            }
                            {loading ? 'Submitting…' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Report Card ──────────────────────────────────────────────────────────────

const ReportCard = ({ report }) => {
    const [expanded, setExpanded] = useState(false);
    const statusInfo = STATUS_MAP[report.status] || STATUS_MAP.pending;
    const StatusIcon = statusInfo.icon;
    const hasAdminResponse = report.adminResponse?.message;

    return (
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
            {/* Header row */}
            <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-all"
                onClick={() => setExpanded(e => !e)}
            >
                <div className="flex items-center gap-4 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                        <Flag className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 capitalize">
                            Reported {report.targetType} · <span className="font-medium text-gray-500">{REASON_LABELS[report.reason] || report.reason}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {hasAdminResponse && (
                        <span className="hidden sm:flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                            <Shield className="w-3 h-3" /> Response
                        </span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.cls}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                    </span>
                    {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
            </div>

            {/* Expanded details */}
            {expanded && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50 space-y-4">
                    {report.description && (
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</p>
                            <p className="text-sm text-gray-700">{report.description}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-gray-200 rounded-xl p-3">
                            <p className="text-xs text-gray-400 mb-0.5">Target Type</p>
                            <p className="text-sm font-semibold text-gray-700 capitalize">{report.targetType}</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-3">
                            <p className="text-xs text-gray-400 mb-0.5">Target ID</p>
                            <p className="text-xs font-mono text-gray-600 truncate">#{report.targetId?.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>

                    {/* Screenshots */}
                    {report.screenshotUrls?.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Screenshots</p>
                            <div className="flex gap-2 flex-wrap">
                                {report.screenshotUrls.map((url, i) => (
                                    <a key={i} href={`http://localhost:5000${url}`} target="_blank" rel="noopener noreferrer">
                                        <img src={`http://localhost:5000${url}`} alt={`screenshot-${i}`}
                                            className="w-20 h-20 rounded-xl object-cover border border-gray-200 hover:opacity-80 transition-opacity" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Admin Response */}
                    {hasAdminResponse ? (
                        <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-4 h-4 text-emerald-600" />
                                <p className="text-sm font-bold text-emerald-700">Admin Response</p>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">{report.adminResponse.message}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                {report.adminResponse.actionTaken && (
                                    <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-full font-medium">
                                        Action: {ACTION_LABELS[report.adminResponse.actionTaken] || report.adminResponse.actionTaken}
                                    </span>
                                )}
                                {report.adminResponse.resolvedBy?.fullName && (
                                    <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-full">
                                        By: {report.adminResponse.resolvedBy.fullName}
                                    </span>
                                )}
                                {report.adminResponse.resolvedAt && (
                                    <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-full">
                                        {new Date(report.adminResponse.resolvedAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                            <Clock className="w-4 h-4 shrink-0" />
                            Your report is queued for admin review. You'll see a response here once it's processed.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Main MyReports Component ─────────────────────────────────────────────────

const MyReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [toast, setToast] = useState('');

    useEffect(() => {
        fetchMyReports();
    }, []);

    const fetchMyReports = async () => {
        setLoading(true);
        try {
            const { data } = await API.get('/reports/my-reports');
            setReports(data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const handleReportSuccess = () => {
        setShowForm(false);
        setToast('Report submitted successfully! Admins will review it shortly.');
        fetchMyReports();
        setTimeout(() => setToast(''), 4000);
    };

    const filtered = filterStatus === 'all' ? reports : reports.filter(r => r.status === filterStatus);

    const filters = [
        { key: 'all', label: 'All' },
        { key: 'pending', label: 'Pending' },
        { key: 'reviewing', label: 'Under Review' },
        { key: 'resolved', label: 'Resolved' },
        { key: 'dismissed', label: 'Dismissed' },
    ];

    return (
        <div className="p-6">
            {/* Top bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">My Reports</h2>
                    <p className="text-sm text-gray-400 mt-0.5">{reports.length} report{reports.length !== 1 ? 's' : ''} submitted</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-semibold rounded-xl hover:from-red-600 hover:to-rose-600 transition-all shadow-md shadow-red-500/20"
                >
                    <Plus className="w-4 h-4" />
                    New Report
                </button>
            </div>

            {/* Toast */}
            {toast && (
                <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                    <CheckCircle className="w-4 h-4 shrink-0" /> {toast}
                </div>
            )}

            {/* Status filter tabs */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {filters.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilterStatus(f.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                            filterStatus === f.key
                                ? 'bg-red-500 text-white shadow-sm'
                                : 'bg-white border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Flag className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-500">
                        {filterStatus === 'all' ? 'No reports yet' : `No ${filterStatus} reports`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {filterStatus === 'all'
                            ? 'Use the "New Report" button to flag suspicious posts, false claims, or users.'
                            : 'Try changing the filter to see other reports.'}
                    </p>
                    {filterStatus === 'all' && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-4 flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-all mx-auto"
                        >
                            <Plus className="w-4 h-4" /> Submit a Report
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(report => (
                        <ReportCard key={report._id} report={report} />
                    ))}
                </div>
            )}

            {/* Submit form modal */}
            {showForm && (
                <SubmitReportForm
                    onSuccess={handleReportSuccess}
                    onCancel={() => setShowForm(false)}
                />
            )}
        </div>
    );
};

export default MyReports;