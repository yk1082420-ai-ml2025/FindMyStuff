import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, User, IdCard, UserPlus, Search } from 'lucide-react';

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        studentId: '',
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (form.studentId.length !== 10) {
            setError('ID should be exactly 10 characters');
            return;
        }

        if (form.fullName.length > 30) {
            setError('Full Name must be 30 characters or less');
            return;
        }

        if (!/^[a-zA-Z\s]+$/.test(form.fullName)) {
            setError('Full Name must only contain English letters and spaces');
            return;
        }

        setLoading(true);
        try {
            await register({
                studentId: form.studentId,
                fullName: form.fullName,
                email: form.email,
                password: form.password,
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        {
            name: 'studentId',
            label: 'Student ID',
            icon: <IdCard className="w-5 h-5" />,
            type: 'text',
            placeholder: 'e.g. IT23543964',
            maxLength: 10,
            minLength: 10,
            customErrorMessage: 'ID should be exactly 10 characters',
        },
        {
            name: 'fullName',
            label: 'Full Name',
            icon: <User className="w-5 h-5" />,
            type: 'text',
            placeholder: 'Pasindu Nirmal',
            maxLength: 30,
        },
        {
            name: 'email',
            label: 'Email',
            icon: <Mail className="w-5 h-5" />,
            type: 'email',
            placeholder: 'it23543964@my.sliit.lk',
        },
    ];

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center px-4 pt-20 pb-8">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-accent-400/10 rounded-full blur-[128px]" />
                <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-primary-100/50 rounded-full blur-[128px]" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md shadow-primary-500/20">
                            <Search className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                            Back2U
                        </span>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white border border-gray-200/60 rounded-2xl p-8 shadow-xl shadow-gray-200/40">
                    <h2 className="text-2xl font-bold text-surface-dark mb-1">Create account</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Join the Back2U community today
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-danger-50 border border-danger-400/20 rounded-xl text-danger-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {fields.map((f) => (
                            <div key={f.name}>
                                <label className="block text-sm text-gray-600 font-medium mb-1.5">
                                    {f.label}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        {f.icon}
                                    </span>
                                    <input
                                        type={f.type}
                                        value={form[f.name]}
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            if (f.name === 'fullName') {
                                                val = val.replace(/[^a-zA-Z\s]/g, '');
                                            }
                                            setForm({ ...form, [f.name]: val });
                                        }}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-surface-dark placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition-all"
                                        placeholder={f.placeholder}
                                        maxLength={f.maxLength}
                                        minLength={f.minLength}
                                        onInvalid={(e) => {
                                            if (f.customErrorMessage && (e.target.validity.tooShort || e.target.validity.patternMismatch)) {
                                                e.target.setCustomValidity(f.customErrorMessage);
                                            } else if (e.target.validity.valueMissing) {
                                                e.target.setCustomValidity('Please fill out this field.');
                                            }
                                        }}
                                        onInput={(e) => {
                                            e.target.setCustomValidity('');
                                        }}
                                        required
                                    />
                                </div>
                            </div>
                        ))}

                        {/* Password */}
                        <div>
                            <label className="block text-sm text-gray-600 font-medium mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-surface-dark placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition-all"
                                    placeholder="Min. 6 characters"
                                        required
                                        minLength={6}
                                        maxLength={100}
                                    />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm text-gray-600 font-medium mb-1.5">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.confirmPassword}
                                    onChange={(e) =>
                                        setForm({ ...form, confirmPassword: e.target.value })
                                    }
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-surface-dark placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition-all"
                                    placeholder="Repeat password"
                                    required
                                    minLength={6}
                                    maxLength={100}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl font-semibold text-white hover:from-primary-600 hover:to-accent-600 transition-all shadow-md shadow-primary-500/20 hover:shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
