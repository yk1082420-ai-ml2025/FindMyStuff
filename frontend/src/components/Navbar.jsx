import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Search, LogOut, User, LayoutDashboard, MessageCircle } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
        setMobileOpen(false);
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

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 text-gray-600 hover:text-surface-dark rounded-lg hover:bg-gray-100"
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
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
