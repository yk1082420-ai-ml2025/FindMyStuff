import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import ClaimPanel from '../components/claims/ClaimPanel';
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
    MapPin,
    Calendar,
    Tag,
    Package,
    ArrowLeft,
    Image,
    Filter,
    RefreshCw,
} from 'lucide-react';

const CATEGORIES = ['All', 'Electronics', 'Documents', 'Clothing', 'Accessories', 'Books', 'Keys', 'Bags', 'Sports', 'Other'];

const inputClass =
    'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-surface-dark placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition-all text-sm';

const emptyForm = {
    title: '',
    description: '',
    category: 'Electronics',
    lastSeenLocation: '',
    dateLost: '',
    color: '',
    brand: '',
    images: [],
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (d) =>
    d
        ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : '—';

// ─── Sub-components ─────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
    if (!status) return null;
    if (status === 'Lost') {
        return (
            <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-xs font-medium shadow-sm">
                Lost
            </span>
        );
    }
    return (
        <span className="px-3 py-1 bg-gray-50 text-gray-600 border border-gray-100 rounded-full text-xs font-medium shadow-sm">
            {status}
        </span>
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

const ItemCard = ({ item, onView }) => (
    <div className="bg-white border border-gray-200/70 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-gray-200/60 hover:border-primary-200/60 transition-all duration-300 group flex flex-col">
        {/* Image */}
        <div className="relative h-44 bg-gray-100 overflow-hidden">
            {item.images && item.images.length > 0 ? (
                <img
                    src={`http://localhost:5000${item.images[0]}`}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
            ) : null}
            <div
                className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ${item.images && item.images.length > 0 ? 'hidden' : 'flex'}`}
            >
                <Package className="w-12 h-12 text-gray-300" />
            </div>
            <div className="absolute top-3 right-3">
                <StatusBadge status={item.status} />
            </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
            <h3 className="font-semibold text-base text-surface-dark mb-1 truncate">{item.title}</h3>
            <p className="text-xs text-gray-400 mb-3 line-clamp-2">{item.description}</p>

            <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Tag className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                    <span>{item.category}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                    <span className="truncate">{item.lastSeenLocation}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                    <span>{formatDate(item.dateLost)}</span>
                </div>
            </div>

            <button
                onClick={() => onView(item)}
                id={`view-lost-${item._id}`}
                className="mt-4 w-full py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200/60 rounded-xl transition-all"
            >
                View Details
            </button>
        </div>
    </div>
);

// ─── Create / Edit Form Modal ────────────────────────────────────────────────

const LostItemFormModal = ({ open, onClose, initial, onSuccess }) => {
    const [form, setForm] = useState(emptyForm);
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const fileRef = useRef();

    // Validation regexes
    // Blocked in name / description / location: % # @ $ ^ & * ( ) ! _ + =
    const specialCharRegex = /[%#@$^&*()!_+=]/;
    // Color / brand: letters (and spaces) only — no digits, no special chars
    const noSpecialOrNumbersRegex = /[^a-zA-Z\s]/;
    const startsWithLetterRegex = /^[A-Za-z]/;

    const isEdit = !!initial;

    useEffect(() => {
        if (open) {
            if (initial) {
                setForm({
                    title: initial.title || '',
                    description: initial.description || '',
                    category: initial.category || 'Other',
                    lastSeenLocation: initial.lastSeenLocation || '',
                    dateLost: initial.dateLost ? initial.dateLost.slice(0, 10) : '',
                    color: initial.color || '',
                    brand: initial.brand || '',
                });
                setPreviews(initial.images ? initial.images.map(i => `http://localhost:5000${i}`) : []);
            } else {
                setForm(emptyForm);
                setPreviews([]);
            }
            setFiles([]);
            setFieldErrors({});
        }
    }, [open, initial]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        const name = id.replace('lost-', '');
        let cleanValue = value;
        let error = '';

        if (['title', 'description', 'location'].includes(name)) {
            const stateName = name === 'location' ? 'lastSeenLocation' : name;
            const fieldKey = stateName;

            // Block special characters — strip them silently
            if (specialCharRegex.test(value)) {
                cleanValue = value.replace(specialCharRegex, '');
                error = 'Can not use special characters';
            }

            // Must-start-with-letter for title and description
            if (['title', 'description'].includes(name)) {
                if (cleanValue.length > 0 && !startsWithLetterRegex.test(cleanValue)) {
                    error = 'Must start with a letter';
                }
            }

            setForm(prev => ({ ...prev, [stateName]: cleanValue }));
            setFieldErrors(prev => ({ ...prev, [fieldKey]: error }));
        } else if (['color', 'brand'].includes(name)) {
            // Show error if input contains numbers or special characters
            if (noSpecialOrNumbersRegex.test(value)) {
                cleanValue = value.replace(noSpecialOrNumbersRegex, '');
                error = 'Can not use special characters and numbers — only letters allowed';
            }
            setForm(prev => ({ ...prev, [name]: cleanValue }));
            setFieldErrors(prev => ({ ...prev, [name]: error }));
        } else {
            // Other fields (date, category)
            setForm(prev => ({ ...prev, [name]: value }));
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        setFiles(selected);
        const newPreviews = selected.map(f => URL.createObjectURL(f));
        if (!isEdit) {
            setPreviews(newPreviews);
        } else {
            setPreviews(prev => [...prev.filter(p => p.startsWith('http://localhost')), ...newPreviews]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = {};

        // ── Required field checks ────────────────────────────────────────────
        if (!form.title.trim())
            errors.title = 'Item Title is required';
        if (!form.description.trim())
            errors.description = 'Description is required';
        if (!form.dateLost)
            errors.dateLost = 'Date Lost is required';
        if (!form.lastSeenLocation.trim())
            errors.lastSeenLocation = 'Location is required';

        // ── Special character checks (Title, Description, Location) ──────────
        if (!errors.title && specialCharRegex.test(form.title))
            errors.title = 'Cannot use special characters';
        if (!errors.description && specialCharRegex.test(form.description))
            errors.description = 'Cannot use special characters';
        if (!errors.lastSeenLocation && specialCharRegex.test(form.lastSeenLocation))
            errors.lastSeenLocation = 'Cannot use special characters';

        // ── Must start with a letter (Title & Description) ───────────────────
        if (!errors.title && form.title.trim() && !startsWithLetterRegex.test(form.title.trim()))
            errors.title = 'Must start with a letter';
        if (!errors.description && form.description.trim() && !startsWithLetterRegex.test(form.description.trim()))
            errors.description = 'Must start with a letter';

        // ── Alpha-only checks (Color & Brand — optional fields) ───────────────
        if (form.color.trim() && noSpecialOrNumbersRegex.test(form.color))
            errors.color = 'Cannot use special characters and numbers — only letters allowed';
        if (form.brand.trim() && noSpecialOrNumbersRegex.test(form.brand))
            errors.brand = 'Cannot use special characters and numbers — only letters allowed';

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        setLoading(true);
        try {
            const formData = new FormData();
            Object.entries(form).forEach(([k, v]) => { if (v !== undefined && v !== null) formData.append(k, v); });
            files.forEach(f => formData.append('images', f));

            if (isEdit) {
                await API.put(`/lost/${initial._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await API.post('/lost', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            onSuccess();
        } catch (err) {
            setFieldErrors({ _form: err.response?.data?.message || (isEdit ? 'Failed to update item' : 'Failed to create item') });
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
                            {isEdit ? 'Edit Lost Item' : 'Report Lost Item'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {isEdit ? 'Update the details of your lost item.' : 'Provide as much detail as possible to help others identify your item.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {fieldErrors._form && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {fieldErrors._form}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">Item Title <span className="text-red-400">*</span></label>
                        <input id="lost-title" type="text" value={form.title} onChange={handleInputChange}
                            className={`${inputClass} ${fieldErrors.title ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''}`}
                            placeholder="e.g. Blue AirPods Pro case" />
                        {fieldErrors.title && (
                            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />{fieldErrors.title}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">Description <span className="text-red-400">*</span></label>
                        <textarea id="lost-description" value={form.description} onChange={handleInputChange}
                            className={`${inputClass} resize-none ${fieldErrors.description ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''}`}
                            rows={3} placeholder="Describe the item in detail..." />
                        {fieldErrors.description && (
                            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />{fieldErrors.description}
                            </p>
                        )}
                    </div>

                    {/* Category & Date row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">Category <span className="text-red-400">*</span></label>
                            <select id="lost-category" value={form.category} onChange={handleInputChange}
                                className={inputClass}>
                                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">Date Lost <span className="text-red-400">*</span></label>
                            <input id="lost-dateLost" type="date" value={form.dateLost} onChange={handleInputChange}
                                max={new Date().toISOString().slice(0, 10)}
                                className={`${inputClass} ${fieldErrors.dateLost ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''}`} />
                            {fieldErrors.dateLost && (
                                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 shrink-0" />{fieldErrors.dateLost}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Last Known Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">Last Known Location <span className="text-red-400">*</span></label>
                        <input id="lost-location" type="text" value={form.lastSeenLocation} onChange={handleInputChange}
                            className={`${inputClass} ${fieldErrors.lastSeenLocation ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''}`}
                            placeholder="e.g. Library 2nd floor, Block A Canteen" />
                        {fieldErrors.lastSeenLocation && (
                            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />{fieldErrors.lastSeenLocation}
                            </p>
                        )}
                    </div>

                    {/* Color & Brand */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">Color</label>
                            <input id="lost-color" type="text" value={form.color} onChange={handleInputChange}
                                className={`${inputClass} ${fieldErrors.color ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''}`}
                                placeholder="e.g. Black, Silver" />
                            {fieldErrors.color && (
                                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 shrink-0" />{fieldErrors.color}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">Brand / Make</label>
                            <input id="lost-brand" type="text" value={form.brand} onChange={handleInputChange}
                                className={`${inputClass} ${fieldErrors.brand ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''}`}
                                placeholder="e.g. Apple, Samsung" />
                            {fieldErrors.brand && (
                                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 shrink-0" />{fieldErrors.brand}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Images */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">Images (up to 5)</label>
                        <div
                            onClick={() => fileRef.current.click()}
                            className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all">
                            <Image className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Click to upload images</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP – max 5MB each</p>
                        </div>
                        <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                        {previews.length > 0 && (
                            <div className="flex gap-2 mt-3 flex-wrap">
                                {previews.map((src, i) => (
                                    <img key={i} src={src} alt={`preview-${i}`}
                                        className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
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
                        <button type="submit" disabled={loading} id="lost-submit-btn"
                            className="flex-1 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:from-red-600 hover:to-pink-600 transition-all shadow-md shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : isEdit ? <><Save className="w-4 h-4" /> Save Changes</> : <><Plus className="w-4 h-4" /> Report Lost Item</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Detail Modal ────────────────────────────────────────────────────────────

const DetailModal = ({ open, onClose, initial, onEdit, onArchive, currentUser, onNavigateToChat }) => {
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveImage(0);
        }
    }, [open]);

    const item = initial;
    if (!open || !item) return null;

    const isOwner = currentUser?._id === item.postedBy?._id || currentUser?._id === item.postedBy;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-full text-gray-400 hover:text-gray-600 z-10 shadow-sm">
                    <X className="w-5 h-5" />
                </button>

                {/* Left: Images */}
                <div className="md:w-[40%] flex flex-col bg-gray-100 relative max-h-[40vh] md:max-h-none">
                    <div className="relative flex-1 overflow-hidden min-h-[250px] md:min-h-[400px]">
                        {item.images && item.images.length > 0 ? (
                            <img
                                src={`http://localhost:5000${item.images[activeImage]}`}
                                alt={item.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                <Image className="w-16 h-16 mb-2 opacity-20" />
                                <span className="text-sm font-medium">No Images Available</span>
                            </div>
                        )}
                        {item.images && item.images.length > 1 && (
                            <>
                                <button
                                    onClick={() => setActiveImage(prev => prev === 0 ? item.images.length - 1 : prev - 1)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all backdrop-blur-sm"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setActiveImage(prev => prev === item.images.length - 1 ? 0 : prev + 1)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all backdrop-blur-sm"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                    {item.images && item.images.length > 1 && (
                        <div className="flex gap-2 p-3 bg-white border-t border-gray-100 overflow-x-auto">
                            {item.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(idx)}
                                    className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-primary-500 opacity-100 ring-2 ring-primary-500/20' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                >
                                    <img src={`http://localhost:5000${img}`} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Info + Claims */}
                <div className="md:w-[60%] flex flex-col">
                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs text-gray-400 font-medium">#{item._id.slice(-6).toUpperCase()}</span>
                            {item.status === 'Claimed' && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Claimed</span>
                            )}
                        </div>

                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{item.title}</h2>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{item.description}</p>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {[
                                { label: 'Category', value: item.category },
                                { label: 'Location', value: item.lastSeenLocation },
                                { label: 'Date Lost', value: formatDate(item.dateLost) },
                                { label: 'Color', value: item.color || '—' },
                                { label: 'Brand', value: item.brand || '—' },
                                { label: 'Posted By', value: item.postedBy?.fullName || 'Anonymous' },
                            ].map(({ label, value }) => (
                                <div key={label} className="p-3 bg-gray-50 rounded-xl">
                                    <span className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">{label}</span>
                                    <span className="text-sm font-semibold text-gray-700">{value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Claims Panel */}
                        {currentUser && (
                            <ClaimPanel
                                item={item}
                                itemType="lost"
                                currentUser={currentUser}
                                onNavigateToChat={onNavigateToChat}
                            />
                        )}

                        {/* Owner actions */}
                        {isOwner && (
                            <div className="border-t border-gray-100 pt-6 flex gap-3 mt-6">
                                <button onClick={onEdit}
                                    className="flex-1 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-surface-dark hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                                    <Edit3 className="w-4 h-4" /> Edit
                                </button>
                                <button onClick={onArchive}
                                    className="flex-1 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                                    <Trash2 className="w-4 h-4" /> Archive
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const LostItems = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

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
    const [location, setLocation] = useState('');
    const [color, setColor] = useState('');
    const [brand, setBrand] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [showCreate, setShowCreate] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [editMode, setEditMode] = useState(false);

    // Suggestions state
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionRef = useRef(null);

    // Debounce search
    const searchTimer = useRef(null);
    const handleSearchChange = (val) => {
        let cleanVal = val;
        // Regex for special characters that should not be in the search bar
        // Note: Some characters like '-', '(', ')', '\', '?', '+' are special in regex and need to be escaped.
        // Other characters like '@', '#', '₹', '%', '&', '"', ':', '!' are literal within a character class.
        const specialCharRegex = /[@#₹%&\-()/\\?+":!']/;

        if (specialCharRegex.test(val)) {
            showToast('Search bar can not contain special characters', 'error');
            // Remove special characters from the input value
            cleanVal = val.replace(specialCharRegex, '');
        }

        setSearch(cleanVal);
        clearTimeout(searchTimer.current);

        if (cleanVal.length >= 1) {
            fetchSuggestions(cleanVal);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }

        searchTimer.current = setTimeout(() => setCurrentPage(1), 300);
    };

    const fetchSuggestions = async (q) => {
        try {
            const { data } = await API.get(`/lost/suggestions?q=${q}`);
            setSuggestions(data);
            setShowSuggestions(data.length > 0);
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            console.error('Suggestions fetch error');
        }
    };

    const handleSuggestionClick = (s) => {
        setSearch(s);
        setSuggestions([]);
        setShowSuggestions(false);
        setCurrentPage(1);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', currentPage);
            params.append('limit', 12);
            if (search) params.append('q', search);
            if (category && category !== 'All') params.append('category', category);
            if (location) params.append('location', location);
            if (color) params.append('color', color);
            if (brand) params.append('brand', brand);
            if (dateFrom) params.append('dateFrom', dateFrom);
            if (dateTo) params.append('dateTo', dateTo);

            const { data } = await API.get(`/lost?${params.toString()}`);
            setItems(data.items);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            showToast('Failed to load items', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, search, category, location, color, brand, dateFrom, dateTo]);

    // Handle deep-link to open a specific item from Dashboard claims
    const locationObj = useLocation();
    useEffect(() => {
        const handleDeepLink = async () => {
            if (locationObj.state?.openItem) {
                setSelectedItem(locationObj.state.openItem);
                setShowDetail(true);
                window.history.replaceState({}, '');
            } else if (locationObj.state?.openItemId) {
                const itemId = locationObj.state.openItemId;
                try {
                    const { data } = await API.get(`/lost/${itemId}`);
                    setSelectedItem(data);
                    setShowDetail(true);
                } catch (error) {
                    console.error('Failed to fetch item for deep-link:', error);
                    showToast('Failed to load item details', 'error');
                }
                window.history.replaceState({}, '');
            }
        };
        handleDeepLink();
    }, [locationObj.state]);

    const showToast = (text, type = 'success') => {
        setToast({ text, type });
        setTimeout(() => setToast({ text: '', type: '' }), 3500);
    };

    const handleFormSuccess = () => {
        setShowCreate(false);
        setEditMode(false);
        setSelectedItem(null);
        setShowDetail(false);
        fetchItems();
        showToast(editMode ? 'Item updated successfully!' : 'Lost item posted successfully!');
    };

    const handleView = (item) => {
        setSelectedItem(item);
        setShowDetail(true);
    };

    const handleEdit = () => {
        setShowDetail(false);
        setEditMode(true);
        setShowCreate(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await API.delete(`/lost/${selectedItem._id}`);
            setShowDelete(false);
            setShowDetail(false);
            setSelectedItem(null);
            fetchItems();
            showToast('Item archived successfully!');
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            showToast('Failed to archive item', 'error');
        }
    };

    const resetFilters = () => {
        setSearch('');
        setCategory('All');
        setLocation('');
        setColor('');
        setBrand('');
        setDateFrom('');
        setDateTo('');
        setCurrentPage(1);
    };

    const hasActiveFilters = category !== 'All' || location || color || brand || dateFrom || dateTo;

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
                    {user && (
                        <button
                            id="report-lost-btn"
                            onClick={() => { setEditMode(false); setSelectedItem(null); setShowCreate(true); }}
                            className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-medium text-sm hover:from-red-600 hover:to-pink-600 transition-all shadow-md shadow-red-500/20 flex items-center gap-2 self-start sm:self-auto"
                        >
                            <Plus className="w-4 h-4" />
                            Report Lost Item
                        </button>
                    )}
                </div>

                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-surface-dark">
                        Lost{' '}
                        <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                            Items
                        </span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Browse and search reported lost items • {totalItems} item{totalItems !== 1 ? 's' : ''} found
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
                                id="lost-search"
                                type="text"
                                value={search}
                                onChange={e => handleSearchChange(e.target.value)}
                                placeholder="Search by item title..."
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-surface-dark placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all text-sm"
                            />
                            {/* Suggestions Dropdown */}
                            {showSuggestions && (
                                <div ref={suggestionRef} className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                    {suggestions.map((s, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSuggestionClick(s)}
                                            className="w-full px-4 py-3 text-left text-sm text-gray-600 hover:bg-red-50 hover:text-red-500 transition-all border-b border-gray-50 last:border-0 flex items-center gap-2"
                                        >
                                            <Search className="w-3 h-3 text-gray-400" />
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${showFilters || hasActiveFilters
                                ? 'bg-primary-50 border-primary-300 text-primary-600'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            {hasActiveFilters && (
                                <span className="w-2 h-2 rounded-full bg-primary-500" />
                            )}
                        </button>
                        {hasActiveFilters && (
                            <button onClick={resetFilters}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-red-500 text-sm flex items-center gap-2 transition-all">
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
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${category === cat
                                    ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-primary-300 hover:text-primary-600'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Expanded filter panel */}
                    {showFilters && (
                        <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {/* Category */}
                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Category</label>
                                <select value={category} onChange={e => { setCategory(e.target.value); setCurrentPage(1); }}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-surface-dark focus:outline-none focus:border-primary-500">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            {/* Location */}
                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Location</label>
                                <input type="text" value={location} onChange={e => {
                                    const cleanVal = e.target.value.replace(/[@#₹%&\-()/\\?+":!']/g, '');
                                    setLocation(cleanVal);
                                    setCurrentPage(1);
                                }}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                                    placeholder="Filter by location" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Color</label>
                                <input type="text" value={color} onChange={e => {
                                    const cleanVal = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                    setColor(cleanVal);
                                    setCurrentPage(1);
                                }}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                                    placeholder="Filter by color" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Brand</label>
                                <input type="text" value={brand} onChange={e => {
                                    const cleanVal = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                    setBrand(cleanVal);
                                    setCurrentPage(1);
                                }}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                                    placeholder="Filter by brand" />
                            </div>
                            <div className="col-span-2 sm:col-span-1 grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1.5 font-medium">Date From</label>
                                    <input type="date" value={dateFrom}
                                        onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }}
                                        max={dateTo || new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1.5 font-medium">Date To</label>
                                    <input type="date" value={dateTo}
                                        onChange={e => { setDateTo(e.target.value); setCurrentPage(1); }}
                                        min={dateFrom}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Items grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="w-10 h-10 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-32">
                        <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-400 mb-1">No lost item</h3>
                        <p className="text-sm text-gray-400">
                            {search || hasActiveFilters ? 'Try adjusting your search or filters.' : 'Be the first to report a lost item!'}
                        </p>
                        {user && !search && !hasActiveFilters && (
                            <button
                                onClick={() => { setEditMode(false); setSelectedItem(null); setShowCreate(true); }}
                                className="mt-6 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:from-red-600 hover:to-pink-600 transition-all shadow-md shadow-red-500/20 inline-flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Report Lost Item
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {items.map(item => (
                            <ItemCard key={item._id} item={item} onView={handleView} />
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
            <LostItemFormModal
                open={showCreate}
                onClose={() => { setShowCreate(false); setEditMode(false); setSelectedItem(null); }}
                initial={editMode ? selectedItem : null}
                onSuccess={handleFormSuccess}
            />

            <DetailModal
                open={showDetail}
                initial={selectedItem}
                onClose={() => { setShowDetail(false); setSelectedItem(null); }}
                onEdit={handleEdit}
                onArchive={() => { setShowDetail(false); setShowDelete(true); }}
                currentUser={user}
                onNavigateToChat={(chatId) => {
                    setShowDetail(false);
                    navigate('/dashboard', { state: { tab: 'messages', chatId } });
                }}
            />

            {/* Delete confirmation */}
            {showDelete && selectedItem && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-center text-surface-dark mb-2">Archive this item?</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            The item will be archived and hidden from the listing. This cannot be undone easily.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDelete(false)}
                                className="flex-1 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleDeleteConfirm} id="confirm-archive-btn"
                                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-all">
                                Archive
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LostItems;
