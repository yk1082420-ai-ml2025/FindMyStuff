import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import {
    User,
    Mail,
    IdCard,
    Trophy,
    Edit3,
    Trash2,
    Save,
    X,
    LayoutDashboard,
    Activity,
    Settings,
    Search,
    FileText,
    CheckCircle,
    AlertCircle,
    LogOut,
} from 'lucide-react';

const StudentDashboard = () => {
    const { updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await API.get('/users/profile');
            setProfile(data);
            setEditForm({
                fullName: data.fullName,
                email: data.email,
                password: '',
            });
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            setMessage({ text: 'Failed to load profile', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { fullName: editForm.fullName, email: editForm.email };
            if (editForm.password) payload.password = editForm.password;

            const { data } = await API.put('/users/profile', payload);
            setProfile(data);
            updateUser(data);
            setEditing(false);
            setMessage({ text: 'Profile updated successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (error) {
            const errorData = error.response?.data;
            const detailedMessage = errorData?.error || (typeof errorData?.message === 'string' ? errorData.message : null);
            setMessage({
                text: detailedMessage || 'Failed to update profile',
                type: 'error',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await API.delete('/users/profile');
            logout();
            navigate('/');
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            setMessage({ text: 'Failed to delete account', type: 'error' });
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: 'activity', label: 'Activity', icon: <Activity className="w-5 h-5" /> },
        { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface text-surface-dark pt-16">
            <div className="flex">
                {/* Sidebar */}
                <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200/60 p-4 hidden lg:flex flex-col">
                    <div className="flex items-center gap-3 p-4 mb-6 bg-gray-50 rounded-xl border border-gray-200/60">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-lg font-bold text-white">
                            {profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-sm truncate text-surface-dark">{profile?.fullName}</p>
                            <p className="text-xs text-gray-500">Student</p>
                        </div>
                    </div>

                    <nav className="space-y-1 flex-1">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${activeTab === item.id
                                    ? 'bg-primary-50 text-primary-600 border border-primary-200/60 font-medium'
                                    : 'text-gray-500 hover:text-surface-dark hover:bg-gray-50'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-500 hover:text-danger-500 hover:bg-gray-50 transition-all mt-auto"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </aside>

                {/* Main content */}
                <main className="flex-1 lg:ml-64 p-6 lg:p-8">
                    {/* Mobile tabs */}
                    <div className="flex gap-2 mb-6 lg:hidden overflow-x-auto pb-2">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${activeTab === item.id
                                    ? 'bg-primary-50 text-primary-600 border border-primary-200/60 font-medium'
                                    : 'text-gray-500 hover:text-surface-dark bg-white border border-gray-200'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Message toast */}
                    {message.text && (
                        <div
                            className={`mb-6 p-4 rounded-xl flex items-center gap-2 text-sm ${message.type === 'success'
                                ? 'bg-success-50 border border-success-400/20 text-success-600'
                                : 'bg-danger-50 border border-danger-400/20 text-danger-600'
                                }`}
                        >
                            {message.type === 'success' ? (
                                <CheckCircle className="w-5 h-5 shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 shrink-0" />
                            )}
                            {message.text}
                        </div>
                    )}

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <>
                            <div className="mb-8">
                                <h1 className="text-2xl font-bold text-surface-dark">Welcome back, {profile?.fullName?.split(' ')[0]}!</h1>
                                <p className="text-gray-500 text-sm mt-1">Here's an overview of your account</p>
                            </div>

                            {/* Stats cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {[
                                    {
                                        label: 'Points',
                                        value: profile?.points || 0,
                                        icon: <Trophy className="w-5 h-5" />,
                                        gradient: 'from-amber-500 to-orange-500',
                                        bg: 'bg-amber-50',
                                        text: 'text-amber-600',
                                    },
                                    {
                                        label: 'Lost Posts',
                                        value: profile?.activityHistory?.lostPosts?.length || 0,
                                        icon: <Search className="w-5 h-5" />,
                                        gradient: 'from-red-500 to-pink-500',
                                        bg: 'bg-red-50',
                                        text: 'text-red-600',
                                    },
                                    {
                                        label: 'Found Posts',
                                        value: profile?.activityHistory?.foundPosts?.length || 0,
                                        icon: <CheckCircle className="w-5 h-5" />,
                                        gradient: 'from-emerald-500 to-teal-500',
                                        bg: 'bg-emerald-50',
                                        text: 'text-emerald-600',
                                    },
                                    {
                                        label: 'Claims',
                                        value: profile?.activityHistory?.claims?.length || 0,
                                        icon: <FileText className="w-5 h-5" />,
                                        gradient: 'from-primary-500 to-accent-500',
                                        bg: 'bg-primary-50',
                                        text: 'text-primary-600',
                                    },
                                ].map((stat, i) => (
                                    <div
                                        key={i}
                                        className="p-5 bg-white border border-gray-200/60 rounded-2xl hover:shadow-md hover:shadow-gray-200/50 transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm text-gray-500">{stat.label}</span>
                                            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center ${stat.text}`}>
                                                {stat.icon}
                                            </div>
                                        </div>
                                        <p className="text-2xl font-bold text-surface-dark">{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Profile Card */}
                            <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden shadow-sm">
                                <div className="h-32 bg-gradient-to-r from-primary-500 to-accent-500 relative">
                                    <div className="absolute -bottom-12 left-6">
                                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-3xl font-bold text-white border-4 border-white shadow-xl">
                                            {profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                    </div>
                                    {!editing && (
                                        <button
                                            onClick={() => setEditing(true)}
                                            className="absolute top-4 right-4 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-sm font-medium text-white hover:bg-white/30 transition-all flex items-center gap-2"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Edit Profile
                                        </button>
                                    )}
                                </div>

                                <div className="pt-16 px-6 pb-6">
                                    {editing ? (
                                        <div className="space-y-4 max-w-lg">
                                            <div>
                                                <label className="block text-sm text-gray-600 font-medium mb-1.5">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={editForm.fullName}
                                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-surface-dark focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 font-medium mb-1.5">Email</label>
                                                <input
                                                    type="email"
                                                    value={editForm.email}
                                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-surface-dark focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 font-medium mb-1.5">
                                                    New Password <span className="text-gray-400">(leave blank to keep)</span>
                                                </label>
                                                <input
                                                    type="password"
                                                    value={editForm.password}
                                                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-surface-dark focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition-all"
                                                    placeholder="••••••••"
                                                    minLength={6}
                                                />
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={handleSave}
                                                    disabled={saving}
                                                    className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl font-medium text-sm text-white hover:from-primary-600 hover:to-accent-600 transition-all shadow-md shadow-primary-500/20 flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {saving ? (
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <Save className="w-4 h-4" />
                                                    )}
                                                    Save Changes
                                                </button>
                                                <button
                                                    onClick={() => setEditing(false)}
                                                    className="px-6 py-2.5 bg-gray-100 border border-gray-200 rounded-xl font-medium text-sm text-gray-600 hover:bg-gray-200 transition-all flex items-center gap-2"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <h2 className="text-xl font-bold text-surface-dark">{profile?.fullName}</h2>
                                                <p className="text-gray-500 text-sm capitalize">{profile?.role}</p>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                    <Mail className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-xs text-gray-400">Email</p>
                                                        <p className="text-sm text-surface-dark">{profile?.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                    <IdCard className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-xs text-gray-400">Student ID</p>
                                                        <p className="text-sm text-surface-dark">{profile?.studentId}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                    <Trophy className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-xs text-gray-400">Points</p>
                                                        <p className="text-sm text-surface-dark">{profile?.points}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                    <Activity className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-xs text-gray-400">Status</p>
                                                        <p className="text-sm">
                                                            <span
                                                                className={`inline-flex items-center gap-1 ${profile?.isActive ? 'text-success-600' : 'text-danger-600'
                                                                    }`}
                                                            >
                                                                <span className={`w-2 h-2 rounded-full ${profile?.isActive ? 'bg-success-500' : 'bg-danger-500'}`} />
                                                                {profile?.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Activity Tab */}
                    {activeTab === 'activity' && (
                        <>
                            <div className="mb-8">
                                <h1 className="text-2xl font-bold text-surface-dark">Activity History</h1>
                                <p className="text-gray-500 text-sm mt-1">Your lost & found activity</p>
                            </div>

                            <div className="grid gap-6">
                                {[
                                    {
                                        title: 'Lost Posts',
                                        count: profile?.activityHistory?.lostPosts?.length || 0,
                                        icon: <Search className="w-5 h-5" />,
                                        gradient: 'from-red-500 to-pink-500',
                                        message: 'No lost item posts yet. When you report a lost item, it will appear here.',
                                    },
                                    {
                                        title: 'Found Posts',
                                        count: profile?.activityHistory?.foundPosts?.length || 0,
                                        icon: <CheckCircle className="w-5 h-5" />,
                                        gradient: 'from-emerald-500 to-teal-500',
                                        message: 'No found item posts yet. Help others by reporting items you find!',
                                    },
                                    {
                                        title: 'Claims',
                                        count: profile?.activityHistory?.claims?.length || 0,
                                        icon: <FileText className="w-5 h-5" />,
                                        gradient: 'from-primary-500 to-accent-500',
                                        message: 'No claims yet. Claim items that belong to you from the found board.',
                                    },
                                ].map((section, i) => (
                                    <div
                                        key={i}
                                        className="p-6 bg-white border border-gray-200/60 rounded-2xl"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center text-white`}>
                                                {section.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-surface-dark">{section.title}</h3>
                                                <p className="text-sm text-gray-500">{section.count} total</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/60 text-center">
                                            <p className="text-sm text-gray-500">{section.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <>
                            <div className="mb-8">
                                <h1 className="text-2xl font-bold text-surface-dark">Settings</h1>
                                <p className="text-gray-500 text-sm mt-1">Manage your account settings</p>
                            </div>

                            <div className="space-y-6">
                                {/* Account Info */}
                                <div className="p-6 bg-white border border-gray-200/60 rounded-2xl">
                                    <h3 className="font-semibold text-surface-dark mb-4">Account Information</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Created</p>
                                            <p className="text-sm text-surface-dark">
                                                {profile?.createdAt
                                                    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Last Updated</p>
                                            <p className="text-sm text-surface-dark">
                                                {profile?.updatedAt
                                                    ? new Date(profile.updatedAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="p-6 bg-danger-50 border border-danger-400/15 rounded-2xl">
                                    <h3 className="font-semibold text-danger-600 mb-2">Danger Zone</h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Once you delete your account, there is no going back. Please be
                                        certain.
                                    </p>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="px-6 py-2.5 bg-white border border-danger-400/30 rounded-xl text-danger-600 text-sm font-medium hover:bg-danger-50 transition-all flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* Delete confirmation modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="w-12 h-12 rounded-full bg-danger-50 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-6 h-6 text-danger-500" />
                        </div>
                        <h3 className="text-lg font-bold text-center text-surface-dark mb-2">Delete Account?</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            This action cannot be undone. All your data will be permanently
                            removed.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-2.5 bg-danger-500 text-white rounded-xl text-sm font-medium hover:bg-danger-600 transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;