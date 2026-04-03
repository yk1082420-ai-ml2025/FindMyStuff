import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
<<<<<<< HEAD
import { Menu, X, Search, LogOut, User, LayoutDashboard, MessageCircle, Trophy } from 'lucide-react';
=======
import { useNotifications } from '../context/NotificationContext';
import { Menu, X, Search, LogOut, LayoutDashboard, Bell, FileText, MessageCircle, CheckCheck, GitMerge } from 'lucide-react';

const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

const NotificationDropdown = ({ notifications, unreadCount, onNotifClick, onMarkAllRead }) => (
    <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-32px)] bg-white border border-gray-200/60 rounded-2xl shadow-2xl shadow-gray-200/50 overflow-hidden z-50">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary-500" />
                <span className="text-sm font-semibold text-surface-dark">Notifications</span>
                {unreadCount > 0 && (
                    <span className="bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </div>
            {unreadCount > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onMarkAllRead(); }}
                    className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1 transition-colors"
                >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                </button>
            )}
        </div>

        {/* Notification list */}
        <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4">
                    <Bell className="w-10 h-10 text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400 font-medium">No notifications yet</p>
                    <p className="text-xs text-gray-300 mt-0.5">We&apos;ll notify you when something happens</p>
                </div>
            ) : (
                notifications.map((notif) => (
                    <button
                        key={notif._id}
                        onClick={() => onNotifClick(notif)}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-all border-b border-gray-50 last:border-b-0 ${
                            !notif.isRead ? 'bg-primary-50/30' : ''
                        }`}
                    >
                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            notif.type === 'claim'
                                ? 'bg-amber-50 text-amber-500'
                                : notif.type === 'match'
                                    ? 'bg-violet-50 text-violet-500'
                                    : 'bg-blue-50 text-blue-500'
                        }`}>
                            {notif.type === 'claim'
                                ? <FileText className="w-4 h-4" />
                                : notif.type === 'match'
                                    ? <GitMerge className="w-4 h-4" />
                                    : <MessageCircle className="w-4 h-4" />
                            }
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${!notif.isRead ? 'font-semibold text-surface-dark' : 'text-gray-600'}`}>
                                {notif.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{notif.message}</p>
                            <p className="text-[10px] text-gray-300 mt-1 font-medium uppercase tracking-wider">
                                {formatTimeAgo(notif.createdAt)}
                            </p>
                        </div>

                        {/* Unread dot */}
                        {!notif.isRead && (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary-500 shrink-0 mt-2 ring-2 ring-primary-500/20" />
                        )}
                    </button>
                ))
            )}
        </div>
    </div>
);
>>>>>>> 9fc9740e0a54c8bc823eda0ffd93750894967bf0

const Navbar = () => {
    const { user, logout } = useAuth();
    const { unreadCount, notifications, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const desktopNotifRef = useRef(null);
    const mobileNotifRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            const clickedDesktop = desktopNotifRef.current && desktopNotifRef.current.contains(e.target);
            const clickedMobile = mobileNotifRef.current && mobileNotifRef.current.contains(e.target);
            
            if (!clickedDesktop && !clickedMobile) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
        setMobileOpen(false);
    };

    const handleNotifClick = async (notif) => {
        if (!notif.isRead) {
            await markAsRead(notif._id);
        }
        setNotifOpen(false);
        setMobileOpen(false);

        const dashPath = user?.role === 'admin' ? '/admin' : '/dashboard';

        if (notif.type === 'claim') {
            navigate(dashPath, { state: { tab: 'claims', _ts: Date.now() }, replace: false });
        } else if (notif.type === 'message') {
            navigate(dashPath, { state: { tab: 'messages', chatId: notif.relatedId, _ts: Date.now() }, replace: false });
        } else if (notif.type === 'match') {
            // Navigate to the relevant post page so the user can view the match
            if (notif.itemType === 'found') {
                navigate('/found-items', { state: { openItemId: notif.itemId } });
            } else if (notif.itemType === 'lost') {
                navigate('/lost', { state: { openItemId: notif.itemId } });
            }
        }
    };

    const handleBellClick = () => {
        if (!notifOpen) {
            fetchNotifications();
        }
        setNotifOpen(!notifOpen);
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:shadow-primary-500/30 transition-shadow">
                            <Search className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                            Back2U
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-1">
                        <Link
                            to="/"
                            className="px-4 py-2 text-sm text-gray-600 hover:text-surface-dark rounded-lg hover:bg-gray-100 transition-all"
                        >
                            Home
                        </Link>
                        <Link
                            to="/found-items"
                            className="px-4 py-2 text-sm text-gray-600 hover:text-surface-dark rounded-lg hover:bg-gray-100 transition-all"
                        >
                            Found
                        </Link>
                        <Link
                            to="/lost"
                            className="px-4 py-2 text-sm text-gray-600 hover:text-surface-dark rounded-lg hover:bg-gray-100 transition-all"
                        >
                            Lost
                        </Link>
                        <Link
                            to="/notices"
                            className="px-4 py-2 text-sm text-gray-600 hover:text-surface-dark rounded-lg hover:bg-gray-100 transition-all"
                        >
                            Notices
                        </Link>

                        {/* NEW: Leaderboard link */}
                        <Link
                            to="/leaderboard"
                            className="px-4 py-2 text-sm text-gray-600 hover:text-surface-dark rounded-lg hover:bg-gray-100 transition-all flex items-center gap-1"
                        >
                            <Trophy className="w-4 h-4" />
                            Leaderboard
                        </Link>

                        {user ? (
                            <>
                                <Link
                                    to={user.role === 'admin' ? '/admin' : '/dashboard'}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-surface-dark rounded-lg hover:bg-gray-100 transition-all flex items-center gap-2"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </Link>
                               
                                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                                    {/* Notification bell */}
                                    <div className="relative" ref={desktopNotifRef}>
                                        <button
                                            onClick={handleBellClick}
                                            className="relative p-2 text-gray-400 hover:text-surface-dark rounded-lg hover:bg-gray-100 transition-all"
                                            title="Notifications"
                                            id="notification-bell"
                                        >
                                            <Bell className="w-5 h-5" />
                                            {unreadCount > 0 && (
                                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 ring-2 ring-white animate-pulse">
                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                </span>
                                            )}
                                        </button>
                                        {notifOpen && (
                                            <NotificationDropdown
                                                notifications={notifications}
                                                unreadCount={unreadCount}
                                                onNotifClick={handleNotifClick}
                                                onMarkAllRead={markAllAsRead}
                                            />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-sm font-semibold text-white">
                                            {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <span className="text-sm text-gray-700 font-medium">{user.fullName}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-gray-400 hover:text-danger-500 rounded-lg hover:bg-gray-100 transition-all"
                                        title="Logout"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 ml-4">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-surface-dark rounded-lg hover:bg-gray-100 transition-all"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all shadow-md shadow-primary-500/20 hover:shadow-primary-500/30"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile: bell + hamburger */}
                    <div className="flex items-center gap-2 md:hidden">
                        {user && (
                            <div className="relative" ref={!mobileOpen ? mobileNotifRef : undefined}>
                                <button
                                    onClick={handleBellClick}
                                    className="relative p-2 text-gray-600 hover:text-surface-dark rounded-lg hover:bg-gray-100"
                                >
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 ring-2 ring-white animate-pulse">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </button>
                                {notifOpen && (
                                    <NotificationDropdown
                                        notifications={notifications}
                                        unreadCount={unreadCount}
                                        onNotifClick={handleNotifClick}
                                        onMarkAllRead={markAllAsRead}
                                    />
                                )}
                            </div>
                        )}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="p-2 text-gray-600 hover:text-surface-dark rounded-lg hover:bg-gray-100"
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-xl">
                    <div className="px-4 py-4 space-y-2">
                        <Link
                            to="/"
                            onClick={() => setMobileOpen(false)}
                            className="block px-4 py-3 text-sm text-gray-600 hover:text-surface-dark rounded-lg hover:bg-gray-100 transition-all"
                        >
                            Home
                        </Link>
                        <Link
                            to="/found-items"
                            onClick={() => setMobileOpen(false)}
                            className="block px-4 py-3 text-sm text-gray-600 hover:text-surface-dark rounded-lg hover:bg-gray-100 transition-all"
                        >
                            Found
                        </Link>
                        <Link
                            to="/lost"
                            onClick={() => setMobileOpen(false)}
                            className="block px-4 py-3 text-sm text-gray-600 hover:text-surface-dark rounded-lg hover:bg-gray-100 transition-all"
                        >
                            Lost
                        </Link>
                        <Link
                            to="/notices"
                            onClick={() => setMobileOpen(false)}
                            className="block px-4 py-3 text-sm text-gray-600 hover:text-surface-dark rounded-lg hover:bg-gray-100 transition-all"
                        >
                            Notices
                        </Link>

                        {/* NEW: Leaderboard link in mobile */}
                        <Link
                            to="/leaderboard"
                            onClick={() => setMobileOpen(false)}
                            className="block px-4 py-3 text-sm text-gray-600 hover:text-surface-dark rounded-lg hover:bg-gray-100 transition-all flex items-center gap-2"
                        >
                            <Trophy className="w-4 h-4" />
                            Leaderboard
                        </Link>

                        {user ? (
                            <>
                                <Link
                                    to={user.role === 'admin' ? '/admin' : '/dashboard'}
                                    onClick={() => setMobileOpen(false)}
                                    className="block px-4 py-3 text-sm text-gray-600 hover:text-surface-dark rounded-lg hover:bg-gray-100 transition-all"
                                >
                                    Dashboard
                                </Link>
                                
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-3 text-sm text-danger-500 hover:text-danger-600 rounded-lg hover:bg-gray-100 transition-all"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="block px-4 py-3 text-sm text-gray-600 hover:text-surface-dark rounded-lg hover:bg-gray-100 transition-all"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setMobileOpen(false)}
                                    className="block px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg text-center"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;