import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import {
    Search,
    Plus,
    X,
    Edit3,
    Trash2,
    Save,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    AlertCircle,
    Calendar,
    Tag,
    Megaphone,
    ArrowLeft,
    Image,
    Filter,
    RefreshCw,
    Clock,
    AlertTriangle
} from 'lucide-react';

const CATEGORIES = ['All', 'alert', 'event', 'general', 'tips'];
const PRIORITIES = ['All', 'low', 'medium', 'high'];

const inputClass =
    'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-surface-dark placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 focus:bg-white transition-all text-sm';

const emptyForm = {
    title: '',
    content: '',
    category: 'general',
    priority: 'low',
    expiryDate: '',
    isActive: true,
    attachments: [],
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (d) =>
    d
        ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—';

// ─── Sub-components ─────────────────────────────────────────────────────────

const StatusBadge = ({ isActive, priority }) => {
    return (
        <div className="flex gap-2">
            {!isActive ? (
                <span className="px-3 py-1 bg-gray-100 text-gray-500 border border-gray-200 rounded-full text-xs font-medium shadow-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Expired
                </span>
            ) : (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-xs font-medium shadow-sm flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Active
                </span>
            )}
            
            {priority === 'high' && (
                <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" /> High Priority
                </span>
            )}
        </div>
    );
};

const Toast = ({ message, type }) => {
    if (!message) return null;
    return (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 text-sm ${type === 'success'
            ? 'bg-emerald-50 border border-emerald-400/20 text-emerald-700'
            : 'bg-red-50 border border-red-400/20 text-red-700'}`}>
            {type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            {message}
        </div>
    );
};

// ─── Item Card ───────────────────────────────────────────────────────────────

const NoticeCard = ({ item, onView }) => (
    <div className={`bg-white border ${item.priority === 'high' ? 'border-red-200/70 shadow-red-100' : 'border-gray-200/70'} rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-gray-200/60 hover:border-amber-200/60 transition-all duration-300 group flex flex-col relative`}>
        {item.priority === 'high' && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
        )}
        
        {/* Image / Banner */}
        <div className="relative h-64 bg-amber-50/50 overflow-hidden">
            {item.attachments && item.attachments.length > 0 && item.attachments[0].match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                <img
                    src={`http://localhost:5000${item.attachments[0]}`}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
            ) : null}
            <div
                className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 ${item.attachments && item.attachments.length > 0 && item.attachments[0].match(/\.(jpeg|jpg|gif|png|webp)$/i) ? 'hidden' : 'flex'}`}
            >
                <Megaphone className={`w-16 h-16 ${item.priority === 'high' ? 'text-red-300' : 'text-amber-200'}`} />
            </div>
            <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                <StatusBadge isActive={item.isActive} priority={item.priority} />
            </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
            <h3 className="font-semibold text-base text-surface-dark mb-1 truncate">{item.title}</h3>
            <p className="text-xs text-gray-400 mb-3 line-clamp-2">{item.content}</p>

            <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 text-xs text-gray-500 capitalize">
                    <Tag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{item.category} Notice</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 capitalize">
                    <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${item.priority === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
                    <span>{item.priority} Priority</span>
                </div>

            </div>

            <button
                onClick={() => onView(item)}
                id={`view-notice-${item._id}`}
                className="mt-4 w-full py-2 text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 rounded-xl transition-all"
            >
                View Details
            </button>
        </div>
    </div>
);

// ─── Create / Edit Form Modal ────────────────────────────────────────────────

const NoticeFormModal = ({ open, onClose, initial, onSuccess }) => {
    const [form, setForm] = useState(emptyForm);
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileRef = useRef();

    const isEdit = !!initial;

    useEffect(() => {
        if (open) {
            if (initial) {
                // For 'datetime-local' input format
                const localExpiry = initial.expiryDate ? new Date(initial.expiryDate).toISOString().slice(0, 16) : '';
                
                setForm({
                    title: initial.title || '',
                    content: initial.content || '',
                    category: initial.category || 'general',
                    priority: initial.priority || 'low',
                    expiryDate: localExpiry,
                    isActive: initial.isActive !== undefined ? initial.isActive : true,
                });
                setPreviews(initial.attachments ? initial.attachments.map(i => `http://localhost:5000${i}`) : []);
            } else {
                setForm(emptyForm);
                setPreviews([]);
            }
            setFiles([]);
            setError('');
        }
    }, [open, initial]);

    const handleInputChange = (e) => {
        const { id, value, type, checked } = e.target;
        const name = id.replace('notice-', '');
        let cleanValue = type === 'checkbox' ? checked : value;

        // Specific special characters for Title, Content
        const specialCharRegex = /[@#₹%&\-()/\\?+":!']/g;

        if (['title', 'content'].includes(name) && type !== 'checkbox') {
            cleanValue = value.replace(specialCharRegex, '');
            setForm(prev => ({ ...prev, [name]: cleanValue }));
        } else {
            setForm(prev => ({ ...prev, [name]: cleanValue }));
        }
    };

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        setFiles(selected);
        const newPreviews = selected.map(f => {
            if (f.type.startsWith('image/')) return URL.createObjectURL(f);
            return 'document';
        });
        
        if (!isEdit) {
            setPreviews(newPreviews);
        } else {
            setPreviews(prev => [...prev.filter(p => typeof p === 'string' && p.startsWith('http://localhost')), ...newPreviews]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const specialCharRegex = /[@#₹%&\-()/\\?+":!']/;

        if (specialCharRegex.test(form.title)) {
            setError("Title cannot contain special characters such as @ # ₹ % & - ( ) / ? + \" : ! '");
            return;
        }
        if (specialCharRegex.test(form.content)) {
            setError("Content cannot contain special characters such as @ # ₹ % & - ( ) / ? + \" : ! '");
            return;
        }

        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            Object.entries(form).forEach(([k, v]) => { 
                if (v !== undefined && v !== null) formData.append(k, v); 
            });
            files.forEach(f => formData.append('attachments', f));

            if (isEdit) {
                await API.put(`/notices/${initial._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await API.post('/notices', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || (isEdit ? 'Failed to update notice' : 'Failed to create notice'));
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-xl w-full shadow-2xl max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-surface-dark">
                            {isEdit ? 'Edit Campus Notice' : 'Broadcast Campus Notice'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {isEdit ? 'Update details of the notice.' : 'Create a new campus-wide alert or event notice.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">Notice Title <span className="text-red-400">*</span></label>
                        <input id="notice-title" type="text" value={form.title} onChange={handleInputChange}
                            className={inputClass} placeholder="e.g. System Maintenance Weekend" required />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">Content <span className="text-red-400">*</span></label>
                        <textarea id="notice-content" value={form.content} onChange={handleInputChange}
                            className={`${inputClass} resize-none`} rows={4} placeholder="Notice details..." required />
                    </div>

                    {/* Category & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">Category <span className="text-red-400">*</span></label>
                            <select id="notice-category" value={form.category} onChange={handleInputChange}
                                className={`${inputClass} capitalize`}>
                                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">Priority <span className="text-red-400">*</span></label>
                            <select id="notice-priority" value={form.priority} onChange={handleInputChange}
                                className={`${inputClass} capitalize`}>
                                {PRIORITIES.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Expiry Date & IsActive */}
                    <div className="grid grid-cols-2 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">Expiry Date <span className="text-red-400">*</span></label>
                            <input id="notice-expiryDate" type="datetime-local" value={form.expiryDate} onChange={handleInputChange}
                                className={inputClass} required />
                        </div>
                        {isEdit && (
                            <div className="flex items-center h-[46px] px-2 mb-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        id="notice-isActive" 
                                        type="checkbox" 
                                        checked={form.isActive} 
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500" 
                                    />
                                    <span className="text-sm font-medium text-gray-600">Active Notice</span>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Attachments */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">Attachments (Images/Docs up to 5)</label>
                        <div
                            onClick={() => fileRef.current.click()}
                            className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all">
                            <Image className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Click to upload files</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF, DOCX by max 10MB each</p>
                        </div>
                        <input ref={fileRef} type="file" multiple accept=".jpeg,.jpg,.png,.gif,.webp,.pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
                        {previews.length > 0 && (
                            <div className="flex gap-2 mt-3 flex-wrap">
                                {previews.map((src, i) => (
                                    src === 'document' ? (
                                        <div key={i} className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium p-1 text-center truncate">
                                            Doc {i+1}
                                        </div>
                                    ) : (
                                        <img key={i} src={src} alt={`preview-${i}`}
                                            className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                                    )
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} id="notice-submit-btn"
                            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : isEdit ? <><Save className="w-4 h-4" /> Save Changes</> : <><Megaphone className="w-4 h-4" /> Broadcast Notice</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Detail Modal ────────────────────────────────────────────────────────────

const DetailModal = ({ open, onClose, initial }) => {
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveImage(0);
        }
    }, [open]);

    const item = initial;
    if (!open || !item) return null;

    // Only render image thumbs if they are potentially images
    const imageAttachments = (item.attachments || []).filter(att => att.match(/\.(jpeg|jpg|gif|png|webp)$/i));
    const otherAttachments = (item.attachments || []).filter(att => !att.match(/\.(jpeg|jpg|gif|png|webp)$/i));

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-full text-gray-400 hover:text-gray-600 z-10 shadow-sm">
                    <X className="w-5 h-5" />
                </button>

                {/* Left: Images/Media */}
                <div className="md:w-[45%] flex flex-col bg-amber-50 relative max-h-[40vh] md:max-h-none border-r border-amber-100">
                    <div className="relative flex-1 overflow-hidden min-h-[250px] md:min-h-[400px]">
                        {imageAttachments.length > 0 ? (
                            <img
                                src={`http://localhost:5000${imageAttachments[activeImage]}`}
                                alt={item.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-amber-300">
                                <Megaphone className="w-16 h-16 mb-2 opacity-40" />
                                <span className="text-sm font-bold opacity-70 uppercase tracking-widest">{item.category} Notice</span>
                            </div>
                        )}
                        {imageAttachments.length > 1 && (
                            <>
                                <button 
                                    onClick={() => setActiveImage(prev => prev === 0 ? imageAttachments.length - 1 : prev - 1)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all backdrop-blur-sm"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => setActiveImage(prev => prev === imageAttachments.length - 1 ? 0 : prev + 1)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all backdrop-blur-sm"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                    {imageAttachments.length > 1 && (
                        <div className="flex gap-2 p-3 bg-white border-t border-gray-100 overflow-x-auto">
                            {imageAttachments.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(idx)}
                                    className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-amber-500 opacity-100 ring-2 ring-amber-500/20' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                >
                                    <img src={`http://localhost:5000${img}`} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Info */}
                <div className="md:w-[55%] p-6 md:p-8 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-4 justify-between">
                        <span className="text-xs text-gray-400 font-medium">#{item._id.slice(-6).toUpperCase()}</span>
                        <StatusBadge isActive={item.isActive} priority={item.priority} />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-2 leading-tight">{item.title}</h2>
                    
                    <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-amber-500 mb-6">
                        <span>{item.category} Notice</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-200"></span>
                        <span>{formatDate(item.createdAt)}</span>
                    </div>

                    <div className="prose prose-sm max-w-none text-gray-600 mb-8 whitespace-pre-wrap">
                        {item.content}
                    </div>

                    {otherAttachments.length > 0 && (
                        <div className="mb-8">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Attached Documents</h4>
                            <div className="flex flex-col gap-2">
                                {otherAttachments.map((doc, idx) => (
                                    <a key={idx} href={`http://localhost:5000${doc}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100">
                                        <span className="text-sm font-medium text-gray-700 truncate mr-4">Attachment {idx + 1}</span>
                                        <span className="text-xs font-bold text-amber-500 uppercase">View</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <span className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">Posted By</span>
                            <span className="text-sm font-semibold text-gray-700">{item.createdBy?.fullName || 'Admin'}</span>
                        </div>
                    </div>

                    {/* Admin actions removed — managed from admin dashboard */}
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const Notices = () => {
    const { user } = useAuth();

    // List state
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [toast, setToast] = useState({ text: '', type: '' });

    // Filter state
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [priority, setPriority] = useState('All');
    const [activeStatus, setActiveStatus] = useState(user?.role === 'admin' ? 'All' : 'true');
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [showDetail, setShowDetail] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Debounce search
    const searchTimer = useRef(null);
    const handleSearchChange = (val) => {
        let cleanVal = val;
        const specialCharRegex = /[@#₹%&\-()/\\?+":!']/;

        if (specialCharRegex.test(val)) {
            showToast('Search bar cannot contain special characters', 'error');
            cleanVal = val.replace(/[@#₹%&\-()/\\?+":!']/g, '');
        }
        
        setSearch(cleanVal);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => setCurrentPage(1), 300);
    };

    const fetchItems = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', currentPage);
            params.append('limit', 12);
            if (search) params.append('q', search);
            if (category && category !== 'All') params.append('category', category);
            if (priority && priority !== 'All') params.append('priority', priority);
            
            // Only admins can see inactive notices if they choose
            if (activeStatus !== 'All') {
                params.append('active', activeStatus);
            }

            const { data } = await API.get(`/notices?${params.toString()}`);
            setItems(data.notices);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            showToast('Failed to load notices', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, search, category, priority, activeStatus]);

    const showToast = (text, type = 'success') => {
        setToast({ text, type });
        setTimeout(() => setToast({ text: '', type: '' }), 3500);
    };

    const handleView = (item) => {
        setSelectedItem(item);
        setShowDetail(true);
    };

    const resetFilters = () => {
        setSearch('');
        setCategory('All');
        setPriority('All');
        setActiveStatus(user?.role === 'admin' ? 'All' : 'true');
        setCurrentPage(1);
    };

    const hasActiveFilters = category !== 'All' || priority !== 'All' || (user?.role === 'admin' && activeStatus !== 'All');

    return (
        <div className="min-h-screen bg-surface text-surface-dark pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="text-sm text-gray-500 hover:text-primary-600 flex items-center gap-1 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to Home
                        </Link>
                    </div>
                    {/* Create Notice button removed — admin manages from dashboard */}
                </div>

                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-surface-dark">
                        Campus{' '}
                        <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                            Notices
                        </span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Important updates, events, and campus alerts • {totalItems} notice{totalItems !== 1 ? 's' : ''} found
                    </p>
                </div>

                {/* Toast */}
                <Toast message={toast.text} type={toast.type} />

                {/* Search + filter row */}
                <div className="flex flex-col gap-3 mb-6">
                    {/* Primary search row */}
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                id="notice-search"
                                type="text"
                                value={search}
                                onChange={e => handleSearchChange(e.target.value)}
                                placeholder="Search by title or content..."
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-surface-dark placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all text-sm"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${showFilters || hasActiveFilters
                                ? 'bg-amber-50 border-amber-300 text-amber-600'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            {hasActiveFilters && (
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                            )}
                        </button>
                        {hasActiveFilters && (
                            <button onClick={resetFilters}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-amber-500 text-sm flex items-center gap-2 transition-all">
                                <RefreshCw className="w-4 h-4" /> Reset
                            </button>
                        )}
                    </div>

                    {/* Category quick-filter pills */}
                    <div className="flex gap-2 flex-wrap">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => { setCategory(cat); setCurrentPage(1); }}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border capitalize ${category === cat
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300 hover:text-amber-600'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Expanded filter panel */}
                    {showFilters && (
                        <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {/* Category */}
                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Category</label>
                                <select value={category} onChange={e => { setCategory(e.target.value); setCurrentPage(1); }}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-surface-dark focus:outline-none focus:border-amber-500 capitalize">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            {/* Priority */}
                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Priority</label>
                                <select value={priority} onChange={e => { setPriority(e.target.value); setCurrentPage(1); }}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-surface-dark focus:outline-none focus:border-amber-500 capitalize">
                                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            
                            {/* Admin specific active filter */}
                            {user?.role === 'admin' && (
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1.5 font-medium">Status</label>
                                    <select value={activeStatus} onChange={e => { setActiveStatus(e.target.value); setCurrentPage(1); }}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-surface-dark focus:outline-none focus:border-amber-500">
                                        <option value="All">All Notifications</option>
                                        <option value="true">Active Only</option>
                                        <option value="false">Expired Only</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Items grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-32">
                        <Megaphone className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-400 mb-1">No notices found</h3>
                        <p className="text-sm text-gray-400">
                            {search || hasActiveFilters ? 'Try adjusting your search or filters.' : 'There are currently no announcements.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {items.map(item => (
                            <NoticeCard key={item._id} item={item} onView={handleView} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200/60">
                        <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}

            <DetailModal
                open={showDetail}
                initial={selectedItem}
                onClose={() => { setShowDetail(false); setSelectedItem(null); }}
            />
        </div>
    );
};

export default Notices;
