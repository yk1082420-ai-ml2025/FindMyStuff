import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import API from '../api/axios';
import ChatList from '../components/chat/ChatList';
import ChatView from '../components/chat/ChatView';
import { getMyClaims, getReceivedClaims, getMyFoundPosts, getMyLostPosts } from '../api/claims';
import MyReports from '../components/MyReports';
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
    Settings,
    Search,
    FileText,
    CheckCircle,
    AlertCircle,
    LogOut,
    MessageCircle,
    Package,
    Archive,
    Eye,
    ClipboardList,
    Flag,
    Bell,
    CheckCheck,
    Check,
    BellOff,
    TrendingUp, 
    Award,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { formatTimeAgo } from '../utils/dateUtils';

const StudentDashboard = () => {
    const { updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [profile, setProfile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedChat, setSelectedChat] = useState(null);
    const [myClaims, setMyClaims] = useState([]);
    const [receivedClaims, setReceivedClaims] = useState([]);
    const [claimsLoading, setClaimsLoading] = useState(false);
    const [claimsSubTab, setClaimsSubTab] = useState('submitted');
    const [myFoundPosts, setMyFoundPosts] = useState([]);
    const [myLostPosts, setMyLostPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const { 
        notifications, 
        unreadCount: notifUnreadCount, 
        markAsRead, 
        markAllAsRead, 
        deleteNotification, 
        deleteAllNotifications,
        fetchNotifications 
    } = useNotifications();
    
    const [chatUnreadCount, setChatUnreadCount] = useState(0);
    

    // Handle deep-link from notifications and item detail modals
    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
            if (location.state.chatId) {
                setSelectedChat({ _id: location.state.chatId });
            }
        }
    }, [location.state]);

    useEffect(() => {
        fetchProfile();
        fetchChatUnreadCount();
        // Fetch claims on load so overview stats are always accurate
        getMyClaims().then(r => setMyClaims(r.data || [])).catch(() => {});
        getReceivedClaims().then(r => setReceivedClaims(r.data || [])).catch(() => {});
    }, []);

    const fetchChatUnreadCount = async () => {
        try {
            const { data } = await API.get('/chats');
            const chats = data.data || [];
            const count = chats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);
            setChatUnreadCount(count);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'claims') {
            setClaimsLoading(true);
            Promise.all([
                getMyClaims().then(r => setMyClaims(r.data || [])).catch(() => {}),
                getReceivedClaims().then(r => setReceivedClaims(r.data || [])).catch(() => {}),
            ]).finally(() => setClaimsLoading(false));
        }
        if (activeTab === 'posts') {
            setPostsLoading(true);
            Promise.all([
                getMyFoundPosts().then(r => setMyFoundPosts(r.data || [])).catch(() => {}),
                getMyLostPosts().then(r => setMyLostPosts(r.data || [])).catch(() => {}),
            ]).finally(() => setPostsLoading(false));
        }
    }, [activeTab]);
    
    useEffect(() => {
    if (activeTab === 'overview') {
        fetchProfile();
    }
}, [activeTab]);

const fetchProfile = async () => {
    try {
        const { data } = await API.get('/users/profile');
        console.log('Profile data from backend:', data); 
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

            if (editForm.fullName.length > 30) {
                setMessage({ text: 'Full Name must be 30 characters or less', type: 'error' });
                return;
            }

            if (!/^[a-zA-Z\s]+$/.test(editForm.fullName)) {
                setMessage({ text: 'Full Name must only contain English letters and spaces', type: 'error' });
                return;
            }

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

    const handleNotifClick = async (notif) => {
        if (!notif.isRead) {
            await markAsRead(notif._id);
        }

        if (notif.type === 'claim') {
            setActiveTab('claims');
        } else if (notif.type === 'message') {
            setSelectedChat({ _id: notif.relatedId });
            setActiveTab('messages');
        }
    };

    const toggleNotifications = async () => {
        try {
            const newStatus = profile?.notificationsEnabled !== false ? false : true;
            setProfile(prev => ({ ...prev, notificationsEnabled: newStatus }));
            const { data } = await API.put('/users/profile', { notificationsEnabled: newStatus });
            setProfile(data);
            if (updateUser) updateUser(data);
            setMessage({ text: `Notifications ${newStatus ? 'enabled' : 'disabled'} successfully!`, type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (error) {
            setMessage({ text: 'Failed to update notification settings', type: 'error' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            // revert
            setProfile(prev => ({ ...prev, notificationsEnabled: prev?.notificationsEnabled !== false ? false : true }));
        }
    };

    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: 'posts', label: 'Your Posts', icon: <ClipboardList className="w-5 h-5" /> },
        { id: 'claims', label: 'Claims', icon: <FileText className="w-5 h-5" /> },
        { id: 'messages', label: 'Messages', icon: <MessageCircle className="w-5 h-5" /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
        { id: 'reports', label: 'Reports', icon: <Flag className="w-5 h-5" /> },
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
                                {item.id === 'messages' && chatUnreadCount > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {chatUnreadCount}
                                    </span>
                                )}
                                {item.id === 'notifications' && notifUnreadCount > 0 && (
                                    <span className="ml-auto bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {notifUnreadCount}
                                    </span>
                                )}
                            </button>
                        ))}
                        
                        {/* Communication Section with Messages Link */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Quick Links
                            </h3>
                            <div className="mt-2 space-y-1">
                                <Link
                                    to="/chat"
                                    className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50"
                                >
                                    <MessageCircle className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                    Open Chat
                                    {chatUnreadCount > 0 && (
                                        <span className="ml-auto bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                                            {chatUnreadCount}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        </div>
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
                                {item.id === 'messages' && chatUnreadCount > 0 && (
                                    <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                        {chatUnreadCount}
                                    </span>
                                )}
                                {item.id === 'notifications' && notifUnreadCount > 0 && (
                                    <span className="ml-1 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                        {notifUnreadCount}
                                    </span>
                                )}
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
                    label: 'Total Points',
                    value: profile?.points || 0,
                    subValue: profile?.monthlyPoints ? `+${profile.monthlyPoints} this month` : null,
                    icon: <Trophy className="w-5 h-5" />,
                    bg: 'bg-amber-50',
                    text: 'text-amber-600',
                },
                {
                    label: 'Lost Posts',
                    value: profile?.activityHistory?.lostPosts?.length || 0,
                    icon: <Search className="w-5 h-5" />,
                    bg: 'bg-red-50',
                    text: 'text-red-600',
                },
                {
                    label: 'Found Posts',
                    value: profile?.activityHistory?.foundPosts?.length || 0,
                    icon: <CheckCircle className="w-5 h-5" />,
                    bg: 'bg-emerald-50',
                    text: 'text-emerald-600',
                },
                {
                    label: 'Claims',
                    value: myClaims.length + receivedClaims.length,
                    icon: <FileText className="w-5 h-5" />,
                    bg: 'bg-primary-50',
                    text: 'text-primary-600',
                },
                {
    label: 'Successful Returns',
    value: profile?.successfulReturns || 0,
    icon: <CheckCircle className="w-5 h-5" />,
    bg: 'bg-teal-50',
    text: 'text-teal-600',
}
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
                    <div>
                        <p className="text-2xl font-bold text-surface-dark">{stat.value}</p>
                        {stat.subValue && (
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> {stat.subValue}
                            </p>
                        )}
                    </div>
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
                                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value.replace(/[^a-zA-Z\s]/g, '') })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-surface-dark focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition-all"
                                                    maxLength={30}
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
                                                    <AlertCircle className="w-5 h-5 text-gray-400" />
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

                    {/* Your Posts Tab */}
                    {activeTab === 'posts' && (
                        <>
                            <div className="mb-8">
                                <h1 className="text-2xl font-bold text-surface-dark">Your Posts</h1>
                                <p className="text-gray-500 text-sm mt-1">Lost and found items you have posted</p>
                            </div>

                            {postsLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Lost Posts */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><Search className="w-4 h-4 text-red-500" /></div>
                                            <h3 className="font-semibold text-surface-dark">Lost Posts</h3>
                                            <span className="ml-auto text-xs text-gray-400">{myLostPosts.length} total</span>
                                        </div>
                                        {myLostPosts.length === 0 ? (
                                            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                                                <p className="text-sm text-gray-400">No lost item posts yet.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {myLostPosts.map(item => (
                                                    <div key={item._id}
                                                        onClick={() => navigate('/lost')}
                                                        className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                                                    >
                                                        <div className="h-32 bg-gray-100 relative">
                                                            {item.images?.[0]
                                                                ? <img src={`http://localhost:5000${item.images[0]}`} alt="" className="w-full h-full object-cover" />
                                                                : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-gray-300" /></div>}
                                                            <div className="absolute top-2 right-2 flex gap-1">
                                                                {item.isArchived && (
                                                                    <span className="px-2 py-0.5 bg-gray-800/70 text-white text-[10px] rounded-full flex items-center gap-1"><Archive className="w-3 h-3" /> Archived</span>
                                                                )}
                                                                <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold ${
                                                                    item.status === 'Claimed' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
                                                                }`}>{item.status}</span>
                                                            </div>
                                                        </div>
                                                        <div className="p-3">
                                                            <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">{item.title}</p>
                                                            <p className="text-xs text-gray-400 mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Found Posts */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-emerald-500" /></div>
                                            <h3 className="font-semibold text-surface-dark">Found Posts</h3>
                                            <span className="ml-auto text-xs text-gray-400">{myFoundPosts.length} total</span>
                                        </div>
                                        {myFoundPosts.length === 0 ? (
                                            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                                                <p className="text-sm text-gray-400">No found item posts yet.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {myFoundPosts.map(item => (
                                                    <div key={item._id}
                                                        onClick={() => navigate('/found-items')}
                                                        className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                                                    >
                                                        <div className="h-32 bg-gray-100 relative">
                                                            {item.images?.[0]
                                                                ? <img src={`http://localhost:5000${item.images[0]}`} alt="" className="w-full h-full object-cover" />
                                                                : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-gray-300" /></div>}
                                                            <div className="absolute top-2 right-2 flex gap-1">
                                                                {item.isArchived && (
                                                                    <span className="px-2 py-0.5 bg-gray-800/70 text-white text-[10px] rounded-full flex items-center gap-1"><Archive className="w-3 h-3" /> Archived</span>
                                                                )}
                                                                <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold ${
                                                                    item.status === 'Claimed' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'
                                                                }`}>{item.status}</span>
                                                            </div>
                                                        </div>
                                                        <div className="p-3">
                                                            <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">{item.title}</p>
                                                            <p className="text-xs text-gray-400 mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Claims Tab */}
                    {activeTab === 'claims' && (
                        <>
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold text-surface-dark">Claims</h1>
                                <p className="text-gray-500 text-sm mt-1">Claims you have submitted and received on your posts</p>
                            </div>

                            {/* Sub-tab toggle */}
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => setClaimsSubTab('submitted')}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                        claimsSubTab === 'submitted'
                                            ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                                            : 'bg-white border border-gray-200 text-gray-500 hover:text-surface-dark'
                                    }`}
                                >Submitted ({myClaims.length})</button>
                                <button
                                    onClick={() => setClaimsSubTab('received')}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                        claimsSubTab === 'received'
                                            ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                                            : 'bg-white border border-gray-200 text-gray-500 hover:text-surface-dark'
                                    }`}
                                >Received ({receivedClaims.length})</button>
                            </div>

                            {claimsLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <>
                                    {/* Submitted Claims */}
                                    {claimsSubTab === 'submitted' && (
                                        myClaims.length === 0 ? (
                                            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                                                <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                                <p className="text-sm font-semibold text-gray-400">No claims submitted yet</p>
                                                <p className="text-xs text-gray-300 mt-1">Claims you submit on found or lost items will appear here.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {myClaims.map(claim => {
                                                    const statusMap = {
                                                        pending: 'bg-amber-50 text-amber-700 border-amber-200',
                                                        approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                                        rejected: 'bg-red-50 text-red-700 border-red-200',
                                                        claimed: 'bg-blue-50 text-blue-700 border-blue-200',
                                                    };
                                                    return (
                                                        <div key={claim._id} 
                                                             onClick={() => navigate(claim.itemType === 'found' ? '/found-items' : '/lost', { state: { openItem: claim.item } })}
                                                             className="bg-white border border-gray-200 rounded-2xl p-5 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex items-center gap-3">
                                                                    {claim.item?.images?.[0]
                                                                        ? <img src={`http://localhost:5000${claim.item.images[0]}`} alt="" className="w-14 h-14 rounded-xl object-cover border border-gray-100" />
                                                                        : <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center"><Package className="w-6 h-6 text-gray-300" /></div>
                                                                    }
                                                                    <div>
                                                                        <p className="font-semibold text-gray-800 text-sm">{claim.item?.title || 'Item'}</p>
                                                                        <p className="text-xs text-gray-400 capitalize">{claim.itemType} item</p>
                                                                        <p className="text-xs text-gray-400 mt-0.5">{new Date(claim.createdAt).toLocaleDateString()}</p>
                                                                    </div>
                                                                </div>
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${statusMap[claim.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                                    {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                                                                </span>
                                                            </div>
                                                            {claim.status === 'approved' && claim.chatId && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedChat({ _id: claim.chatId }); setActiveTab('messages'); }}
                                                                    className="mt-3 w-full py-2 text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-100 transition-all font-semibold flex items-center justify-center gap-1.5"
                                                                >
                                                                    <MessageCircle className="w-3.5 h-3.5" /> Open Chat
                                                                </button>
                                                            )}
                                                            {claim.status === 'rejected' && claim.rejectionReason && (
                                                                <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                                                    Reason: {claim.rejectionReason}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )
                                    )}

                                    {/* Received Claims */}
                                    {claimsSubTab === 'received' && (
                                        receivedClaims.length === 0 ? (
                                            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                                                <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                                <p className="text-sm font-semibold text-gray-400">No claims received</p>
                                                <p className="text-xs text-gray-300 mt-1">When others submit claims on your posts, they will appear here.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {receivedClaims.map(claim => {
                                                    const statusMap = {
                                                        pending: 'bg-amber-50 text-amber-700 border-amber-200',
                                                        approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                                        rejected: 'bg-red-50 text-red-700 border-red-200',
                                                        claimed: 'bg-blue-50 text-blue-700 border-blue-200',
                                                    };
                                                    return (
                                                        <div key={claim._id} 
                                                             onClick={() => navigate(claim.itemType === 'found' ? '/found-items' : '/lost', { state: { openItem: claim.item } })}
                                                             className="bg-white border border-gray-200 rounded-2xl p-5 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex items-center gap-3">
                                                                    {claim.item?.images?.[0]
                                                                        ? <img src={`http://localhost:5000${claim.item.images[0]}`} alt="" className="w-14 h-14 rounded-xl object-cover border border-gray-100" />
                                                                        : <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center"><Package className="w-6 h-6 text-gray-300" /></div>
                                                                    }
                                                                    <div>
                                                                        <p className="font-semibold text-gray-800 text-sm">{claim.item?.title || 'Item'}</p>
                                                                        <p className="text-xs text-gray-400">Claimed by: <span className="font-medium text-gray-600">{claim.claimantId?.fullName || 'Unknown'}</span></p>
                                                                        <p className="text-xs text-gray-400 mt-0.5">{new Date(claim.createdAt).toLocaleDateString()}</p>
                                                                    </div>
                                                                </div>
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${statusMap[claim.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                                    {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                                                                </span>
                                                            </div>
                                                            {claim.status === 'pending' && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); navigate(claim.itemType === 'found' ? '/found-items' : '/lost', { state: { openItem: claim.item } }); }}
                                                                    className="mt-3 w-full py-2 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-xl hover:bg-amber-100 transition-all font-semibold flex items-center justify-center gap-1.5"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" /> Review on Post
                                                                </button>
                                                            )}
                                                            {claim.status === 'approved' && claim.chatId && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedChat({ _id: claim.chatId }); setActiveTab('messages'); }}
                                                                    className="mt-3 w-full py-2 text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-100 transition-all font-semibold flex items-center justify-center gap-1.5"
                                                                >
                                                                    <MessageCircle className="w-3.5 h-3.5" /> Open Chat
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* Messages Tab */}
                    {activeTab === 'messages' && (
                        <>
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold text-surface-dark">Messages</h1>
                                <p className="text-gray-500 text-sm mt-1">Chats opened after claim approval</p>
                            </div>
                            <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden shadow-sm flex h-[60vh]">
                                {/* Chat list sidebar */}
                                <div className="w-80 border-r border-gray-100 flex flex-col">
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conversations</p>
                                    </div>
                                    <ChatList
                                        selectedChatId={selectedChat?._id}
                                        onSelectChat={(chat) => setSelectedChat(chat)}
                                    />
                                </div>
                                {/* Chat window */}
                                <div className="flex-1 flex flex-col">
                                    {selectedChat ? (
                                        <ChatView
                                            key={selectedChat._id}
                                            chat={selectedChat}
                                            currentUser={profile}
                                            onBack={() => setSelectedChat(null)}
                                        />
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                            <MessageCircle className="w-12 h-12 text-gray-200 mb-3" />
                                            <p className="text-sm font-semibold text-gray-400">Select a conversation</p>
                                            <p className="text-xs text-gray-300 mt-1">Choose a chat from the left to start messaging</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <>
                            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-surface-dark flex items-center gap-2">
                                        <Bell className="w-6 h-6 text-primary-600" />
                                        Notifications
                                    </h1>
                                    <p className="text-gray-500 text-sm mt-1">
                                        Manage your notifications and stay updated
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-3 px-3 py-2 border border-gray-200/60 rounded-xl bg-white shadow-sm hidden sm:flex">
                                        {profile?.notificationsEnabled !== false ? 
                                            <Bell className="w-4 h-4 text-primary-500" /> : 
                                            <BellOff className="w-4 h-4 text-gray-400" />
                                        }
                                        <span className="text-sm font-medium text-gray-700 block min-w-[60px]">
                                            {profile?.notificationsEnabled !== false ? 'Enabled' : 'Paused'}
                                        </span>
                                        <button
                                            onClick={toggleNotifications}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${profile?.notificationsEnabled !== false ? 'bg-primary-600' : 'bg-gray-300'}`}
                                        >
                                            <span 
                                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profile?.notificationsEnabled !== false ? 'translate-x-4' : 'translate-x-0'}`} 
                                            />
                                        </button>
                                    </div>
                                    {notifUnreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="px-4 py-2 bg-primary-50 text-primary-600 border border-primary-200/60 rounded-xl text-sm font-medium hover:bg-primary-100 transition-all flex items-center gap-2"
                                        >
                                            <CheckCheck className="w-4 h-4" />
                                            Mark all read
                                        </button>
                                    )}
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to clear all notifications?')) {
                                                    deleteAllNotifications();
                                                }
                                            }}
                                            className="px-4 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-100 transition-all flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Clear all
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {notifications.length === 0 ? (
                                    <div className="bg-white border border-gray-200/60 rounded-2xl p-12 text-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Bell className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-surface-dark">No notifications yet</h3>
                                        <p className="text-gray-400 max-w-xs mx-auto mt-1">
                                            We'll notify you here when you receive new claims or messages.
                                        </p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif._id}
                                            onClick={() => handleNotifClick(notif)}
                                            className={`group cursor-pointer bg-white border rounded-2xl p-4 transition-all hover:shadow-md hover:border-primary-200/60 flex items-start gap-4 ${
                                                !notif.isRead ? 'border-primary-100 bg-primary-50/10' : 'border-gray-200/60'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                notif.type === 'claim' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                                            }`}>
                                                {notif.type === 'claim' ? <FileText className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className={`text-sm leading-tight truncate ${!notif.isRead ? 'font-bold text-surface-dark' : 'font-medium text-gray-700'}`}>
                                                        {notif.title}
                                                    </h4>
                                                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                                        {formatTimeAgo(notif.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                    {notif.message}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!notif.isRead && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); markAsRead(notif._id); }}
                                                        className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-all"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                                                    className="p-2 text-gray-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {!notif.isRead && (
                                                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0 group-hover:hidden" />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                    {activeTab === 'reports' && (
                        <>
                            <div className="mb-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h1 className="text-2xl font-bold text-surface-dark flex items-center gap-2">
                                            <Flag className="w-6 h-6 text-primary-600" />
                                            My Reports
                                        </h1>
                                        <p className="text-gray-500 text-sm mt-1">
                                            Track and manage your reported content
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden shadow-sm">
                                <MyReports />
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