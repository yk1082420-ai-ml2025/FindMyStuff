import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api/axios";
import {
  Users,
  UserPlus,
  Search,
  Edit3,
  Trash2,
  Save,
  X,
  LayoutDashboard,
  Shield,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  LogOut,
  UserCheck,
  Megaphone,
  Plus,
  Image,
  Tag,
  Clock,
  AlertTriangle,
  Filter,
  RefreshCw,
  Flag, // Add Flag icon for reports
  Eye,
  Check,
  XCircle,
  Clock as ClockIcon,
  GitMerge,
  Zap,
  ArrowLeftRight,
  Package,
} from "lucide-react";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    students: 0,
    admins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("users");

  // Handle deep-link from notifications
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);
  // ─── Reports state ─────────────────────────────────────────
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsTotalPages, setReportsTotalPages] = useState(1);
  const [reportsTotalItems, setReportsTotalItems] = useState(0);
  const [reportsStats, setReportsStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    dismissed: 0
  });
  const [showReportViewModal, setShowReportViewModal] = useState(false);
  const [showReportStatusModal, setShowReportStatusModal] = useState(false);
  const [showReportDeleteModal, setShowReportDeleteModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportStatusFilter, setReportStatusFilter] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState("");
  const [reportStatusUpdate, setReportStatusUpdate] = useState({
    status: "",
    adminNotes: "",
    resolutionAction: ""
  });
  const [reportStatusLoading, setReportStatusLoading] = useState(false);

  // ─── Matching state ─────────────────────────────────────────────
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchRunning, setMatchRunning] = useState(false);
  const [matchStats, setMatchStats] = useState({ pending: 0, confirmed: 0, dismissed: 0 });
  const [matchStatusFilter, setMatchStatusFilter] = useState('pending');
  const [matchActionLoading, setMatchActionLoading] = useState(null); // stores match _id being processed

  // ─── Notices state ─────────────────────────────────────────
  const CATEGORIES = ['alert', 'event', 'general', 'tips'];
  const PRIORITIES = ['low', 'medium', 'high'];
  const [notices, setNotices] = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(false);
  const [noticesPage, setNoticesPage] = useState(1);
  const [noticesTotalPages, setNoticesTotalPages] = useState(1);
  const [noticesTotalItems, setNoticesTotalItems] = useState(0);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [showDeleteNotice, setShowDeleteNotice] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', category: 'general', priority: 'low', expiryDate: '', isActive: true });
  const [noticeFiles, setNoticeFiles] = useState([]);
  const [noticePreviews, setNoticePreviews] = useState([]);
  const [noticeFormLoading, setNoticeFormLoading] = useState(false);
  const [noticeFormError, setNoticeFormError] = useState('');
  const noticeFileRef = useRef();

  const [createForm, setCreateForm] = useState({
    studentId: "",
    fullName: "",
    email: "",
    password: "",
    role: "student",
    isActive: true,
  });

  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "student",
    isActive: true,
    points: 0,
  });

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    if (activeTab === 'notices') fetchNotices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, noticesPage]);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
      fetchReportsStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, reportsPage, reportStatusFilter, reportTypeFilter]);

  useEffect(() => {
    if (activeTab === 'matching') {
      fetchMatches();
      fetchMatchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, matchStatusFilter]);

  // ─── Reports functions ─────────────────────────────────────────
  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", reportsPage);
      params.append("limit", 10);
      if (reportStatusFilter) params.append("status", reportStatusFilter);
      if (reportTypeFilter) params.append("reportType", reportTypeFilter);
      
      const { data } = await API.get(`/reports/admin/all?${params.toString()}`);
      setReports(data.data);
      setReportsTotalPages(data.pagination?.pages || 1);
      setReportsTotalItems(data.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to fetch reports", error);
      setMessage({ text: "Failed to load reports", type: "error" });
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchReportsStats = async () => {
    try {
      const { data } = await API.get('/reports/admin/stats');
      setReportsStats(data.data);
    } catch (error) {
      console.error("Failed to fetch reports stats", error);
    }
  };

  const handleReportStatusUpdate = async () => {
    setReportStatusLoading(true);
    try {
      await API.put(`/reports/admin/${selectedReport._id}`, reportStatusUpdate);
      setShowReportStatusModal(false);
      setMessage({ text: "Report status updated successfully!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      fetchReports();
      fetchReportsStats();
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || "Failed to update status", 
        type: "error" 
      });
    } finally {
      setReportStatusLoading(false);
    }
  };

  const handleReportDelete = async () => {
    try {
      await API.delete(`/reports/admin/${selectedReport._id}`);
      setShowReportDeleteModal(false);
      setMessage({ text: "Report deleted successfully!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      fetchReports();
      fetchReportsStats();
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || "Failed to delete report", 
        type: "error" 
      });
    }
  };

  const openReportViewModal = (report) => {
    setSelectedReport(report);
    setShowReportViewModal(true);
  };

  const openReportStatusModal = (report) => {
    setSelectedReport(report);
    setReportStatusUpdate({
      status: report.status,
      adminNotes: report.adminNotes || "",
      resolutionAction: report.resolution?.action || "none"
    });
    setShowReportStatusModal(true);
  };

  const openReportDeleteModal = (report) => {
    setSelectedReport(report);
    setShowReportDeleteModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-amber-50 text-amber-600 border-amber-200",
      under_review: "bg-blue-50 text-blue-600 border-blue-200",
      resolved: "bg-emerald-50 text-emerald-600 border-emerald-200",
      dismissed: "bg-gray-50 text-gray-500 border-gray-200"
    };
    return colors[status] || colors.pending;
  };
  const getReasonColor = (reason) => {
    const colors = {
      spam: "bg-orange-50 text-orange-600 border-orange-200",
      harassment: "bg-red-50 text-red-600 border-red-200",
      hate_speech: "bg-purple-50 text-purple-600 border-purple-200",
      false_claim: "bg-blue-50 text-blue-600 border-blue-200",
      misinformation: "bg-cyan-50 text-cyan-600 border-cyan-200",
      inappropriate_content: "bg-pink-50 text-pink-600 border-pink-200",
      other: "bg-gray-50 text-gray-600 border-gray-200"
    };
    return colors[reason] || colors.other;
  };

  // ─── Matching functions ─────────────────────────────────────────────────────
  const fetchMatches = async () => {
    setMatchesLoading(true);
    try {
      const { data } = await API.get(`/matches?status=${matchStatusFilter}`);
      setMatches(data.data || []);
    } catch (error) {
      console.error('Failed to fetch matches', error);
    } finally {
      setMatchesLoading(false);
    }
  };

  const fetchMatchStats = async () => {
    try {
      const { data } = await API.get('/matches/stats');
      setMatchStats(data.data || { pending: 0, confirmed: 0, dismissed: 0 });
    } catch (error) {
      console.error('Failed to fetch match stats', error);
    }
  };

  const handleRunMatching = async () => {
    setMatchRunning(true);
    try {
      const { data } = await API.post('/matches/run');
      setMessage({ text: data.message, type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      fetchMatches();
      fetchMatchStats();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Matching failed', type: 'error' });
    } finally {
      setMatchRunning(false);
    }
  };

  const handleConfirmMatch = async (matchId) => {
    setMatchActionLoading(matchId);
    try {
      await API.post(`/matches/${matchId}/confirm`);
      setMessage({ text: 'Match confirmed! Both users have been notified.', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      fetchMatches();
      fetchMatchStats();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to confirm match', type: 'error' });
    } finally {
      setMatchActionLoading(null);
    }
  };

  const handleDismissMatch = async (matchId) => {
    setMatchActionLoading(matchId);
    try {
      await API.post(`/matches/${matchId}/dismiss`);
      setMessage({ text: 'Match dismissed.', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      fetchMatches();
      fetchMatchStats();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to dismiss match', type: 'error' });
    } finally {
      setMatchActionLoading(null);
    }
  };

  // ─── Notices functions (your existing code) ─────────────────────────
  const fetchNotices = async () => {
    setNoticesLoading(true);
    try {
      const { data } = await API.get(`/notices?page=${noticesPage}&limit=10`);
      setNotices(data.notices);
      setNoticesTotalPages(data.totalPages);
      setNoticesTotalItems(data.totalItems);
    } catch { /* ignore */ } finally {
      setNoticesLoading(false);
    }
  };

  const openNoticeCreate = () => {
    setEditingNotice(null);
    setNoticeForm({ title: '', content: '', category: 'general', priority: 'low', expiryDate: '', isActive: true });
    setNoticeFiles([]);
    setNoticePreviews([]);
    setNoticeFormError('');
    setShowNoticeModal(true);
  };

  const openNoticeEdit = (n) => {
    setEditingNotice(n);
    setNoticeForm({
      title: n.title || '',
      content: n.content || '',
      category: n.category || 'general',
      priority: n.priority || 'low',
      expiryDate: n.expiryDate ? new Date(n.expiryDate).toISOString().slice(0, 16) : '',
      isActive: n.isActive !== undefined ? n.isActive : true,
    });
    setNoticePreviews(n.attachments ? n.attachments.map(i => `http://localhost:5000${i}`) : []);
    setNoticeFiles([]);
    setNoticeFormError('');
    setShowNoticeModal(true);
  };

  const handleNoticeFormChange = (e) => {
    const { id, value, type, checked } = e.target;
    const name = id.replace('adm-notice-', '');
    setNoticeForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleNoticeFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setNoticeFiles(selected);
    const newPrev = selected.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : 'document');
    if (!editingNotice) {
      setNoticePreviews(newPrev);
    } else {
      setNoticePreviews(prev => [...prev.filter(p => typeof p === 'string' && p.startsWith('http://localhost')), ...newPrev]);
    }
  };

  const handleNoticeSubmit = async (e) => {
    e.preventDefault();
    setNoticeFormLoading(true);
    setNoticeFormError('');
    try {
      const formData = new FormData();
      Object.entries(noticeForm).forEach(([k, v]) => { if (v !== undefined && v !== null) formData.append(k, v); });
      noticeFiles.forEach(f => formData.append('attachments', f));
      if (editingNotice) {
        await API.put(`/notices/${editingNotice._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await API.post('/notices', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowNoticeModal(false);
      setMessage({ text: editingNotice ? 'Notice updated!' : 'Notice created!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      fetchNotices();
    } catch (err) {
      setNoticeFormError(err.response?.data?.message || 'Failed to save notice');
    } finally {
      setNoticeFormLoading(false);
    }
  };

  const handleNoticeDelete = async () => {
    try {
      await API.delete(`/notices/${selectedNotice._id}`);
      setShowDeleteNotice(false);
      setSelectedNotice(null);
      setMessage({ text: 'Notice deleted!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      fetchNotices();
    } catch {
      setMessage({ text: 'Failed to delete notice', type: 'error' });
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  // ─── User functions (your existing code) ─────────────────────────
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("limit", 10);
      if (searchTerm) params.append("search", searchTerm);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);

      const { data } = await API.get(`/users?${params.toString()}`);
      setUsers(data.users);
      setTotalPages(data.totalPages);

      const allRes = await API.get("/users?limit=9999");
      const all = allRes.data.users;
      setStats({
        total: allRes.data.totalUsers,
        active: all.filter((u) => u.isActive).length,
        students: all.filter((u) => u.role === "student").length,
        admins: all.filter((u) => u.role === "admin").length,
      });
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      setMessage({ text: "Failed to load users", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await API.post("/users", createForm);
      setShowCreateModal(false);
      setCreateForm({
        studentId: "",
        fullName: "",
        email: "",
        password: "",
        role: "student",
        isActive: true,
      });
      setMessage({ text: "User created successfully!", type: "success" });
      fetchUsers();
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || "Failed to create user",
        type: "error",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        studentId: selectedUser.studentId,
        fullName: editForm.fullName || selectedUser.fullName,
        email: editForm.email || selectedUser.email,
        role: editForm.role || selectedUser.role,
        isActive:
          typeof editForm.isActive !== "undefined"
            ? editForm.isActive
            : selectedUser.isActive,
        points:
          typeof editForm.points !== "undefined"
            ? editForm.points
            : selectedUser.points,
        profilePhoto:
          typeof editForm.profilePhoto !== "undefined"
            ? editForm.profilePhoto
            : selectedUser.profilePhoto,
      };
      if (editForm.password) payload.password = editForm.password;
      await API.put(`/users/${selectedUser._id}`, payload);
      setShowEditModal(false);
      setMessage({ text: "User updated successfully!", type: "success" });
      fetchUsers();
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      const errorData = error.response?.data;
      const detailedMessage = errorData?.error || (typeof errorData?.message === 'string' ? errorData.message : null);
      setMessage({
        text: detailedMessage || "Failed to update user",
        type: "error",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/users/${selectedUser._id}`);
      setShowDeleteModal(false);
      setMessage({ text: "User deleted successfully!", type: "success" });
      fetchUsers();
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || "Failed to delete user",
        type: "error",
      });
    }
  };

  const openEditModal = (u) => {
    setSelectedUser(u);
    setEditForm({
      fullName: u.fullName,
      email: u.email,
      password: "",
      role: u.role,
      isActive: u.isActive,
      points: u.points,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (u) => {
    setSelectedUser(u);
    setShowDeleteModal(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "users", label: "Users", icon: <Users className="w-5 h-5" /> },
    { id: "reports", label: "Reports", icon: <Flag className="w-5 h-5" /> },
    { id: "notices", label: "Notices", icon: <Megaphone className="w-5 h-5" /> },
    { id: "matching", label: "Matching Posts", icon: <GitMerge className="w-5 h-5" /> },
  ];

  const statCards = [
    {
      label: "Total Users",
      value: stats.total,
      icon: <Users className="w-5 h-5" />,
      bg: "bg-primary-50",
      text: "text-primary-600",
    },
    {
      label: "Active Users",
      value: stats.active,
      icon: <UserCheck className="w-5 h-5" />,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    {
      label: "Students",
      value: stats.students,
      icon: <Users className="w-5 h-5" />,
      bg: "bg-violet-50",
      text: "text-violet-600",
    },
    {
      label: "Admins",
      value: stats.admins,
      icon: <Shield className="w-5 h-5" />,
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
  ];

  const reportStatCards = [
    {
      label: "Total Reports",
      value: reportsStats.total,
      icon: <Flag className="w-5 h-5" />,
      bg: "bg-red-50",
      text: "text-red-600",
    },
    {
      label: "Pending",
      value: reportsStats.pending,
      icon: <ClockIcon className="w-5 h-5" />,
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
    {
      label: "Resolved",
      value: reportsStats.resolved,
      icon: <CheckCircle className="w-5 h-5" />,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    {
      label: "Dismissed",
      value: reportsStats.dismissed,
      icon: <XCircle className="w-5 h-5" />,
      bg: "bg-gray-50",
      text: "text-gray-600",
    },
  ];

  const inputClass =
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-surface-dark placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:bg-white transition-all text-sm";
  const selectClass =
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-surface-dark text-sm focus:outline-none focus:border-primary-500 appearance-none cursor-pointer";

  return (
    <div className="min-h-screen bg-surface text-surface-dark pt-16">
      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200/60 p-4 hidden lg:flex flex-col">
          <div className="flex items-center gap-3 p-4 mb-6 bg-gray-50 rounded-xl border border-gray-200/60">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-lg font-bold text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate text-surface-dark">
                {user?.fullName}
              </p>
              <p className="text-xs text-amber-600 font-medium">Admin</p>
            </div>
          </div>

          <nav className="space-y-1 flex-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${activeTab === item.id
                  ? "bg-primary-50 text-primary-600 border border-primary-200/60 font-medium"
                  : "text-gray-500 hover:text-surface-dark hover:bg-gray-50"
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
                  ? "bg-primary-50 text-primary-600 border border-primary-200/60 font-medium"
                  : "text-gray-500 hover:text-surface-dark bg-white border border-gray-200"
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
              className={`mb-6 p-4 rounded-xl flex items-center gap-2 text-sm ${message.type === "success"
                ? "bg-success-50 border border-success-400/20 text-success-600"
                : "bg-danger-50 border border-danger-400/20 text-danger-600"
                }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              {message.text}
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-surface-dark">
                  Admin Dashboard
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Manage users and monitor platform activity
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((stat, i) => (
                  <div
                    key={i}
                    className="p-5 bg-white border border-gray-200/60 rounded-2xl hover:shadow-md hover:shadow-gray-200/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-500">
                        {stat.label}
                      </span>
                      <div
                        className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center ${stat.text}`}
                      >
                        {stat.icon}
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-surface-dark">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-white border border-gray-200/60 rounded-2xl">
                <h3 className="font-semibold text-surface-dark mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      setActiveTab("users");
                      setShowCreateModal(true);
                    }}
                    className="p-4 bg-primary-50 border border-primary-200/60 rounded-xl flex items-center gap-3 hover:bg-primary-100/50 transition-all"
                  >
                    <UserPlus className="w-5 h-5 text-primary-500" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-surface-dark">
                        Create New User
                      </p>
                      <p className="text-xs text-gray-500">
                        Add a student or admin account
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("reports")}
                    className="p-4 bg-red-50 border border-red-200/60 rounded-xl flex items-center gap-3 hover:bg-red-100/50 transition-all"
                  >
                    <Flag className="w-5 h-5 text-red-500" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-surface-dark">
                        Manage Reports
                      </p>
                      <p className="text-xs text-gray-500">
                        Review and moderate reported content
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setActiveTab('notices'); openNoticeCreate(); }}
                    className="p-4 bg-amber-50 border border-amber-200/60 rounded-xl flex items-center gap-3 hover:bg-amber-100/50 transition-all"
                  >
                    <Megaphone className="w-5 h-5 text-amber-500" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-surface-dark">Create Notice</p>
                      <p className="text-xs text-gray-500">Broadcast a campus notice</p>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-surface-dark">
                    User Management
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">
                    {stats.total} total users
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl font-medium text-sm text-white hover:from-primary-600 hover:to-accent-600 transition-all shadow-md shadow-primary-500/20 flex items-center gap-2 self-start"
                >
                  <UserPlus className="w-4 h-4" />
                  Create User
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by name, email, or student ID..."
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-surface-dark placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all text-sm"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-surface-dark text-sm focus:outline-none focus:border-primary-500 appearance-none cursor-pointer"
                >
                  <option value="">All Roles</option>
                  <option value="student">Students</option>
                  <option value="admin">Admins</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-surface-dark text-sm focus:outline-none focus:border-primary-500 appearance-none cursor-pointer"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {/* Users Table */}
              <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-20">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400">No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200/60 bg-gray-50/50">
                          <th className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">
                            User
                          </th>
                          <th className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">
                            Student ID
                          </th>
                          <th className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">
                            Points
                          </th>
                          <th className="text-right text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr
                            key={u._id}
                            className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-sm font-semibold text-white shrink-0">
                                  {u.fullName?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-surface-dark truncate">
                                    {u.fullName}
                                  </p>
                                  <p className="text-xs text-gray-400 truncate">
                                    {u.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">
                                {u.studentId}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${u.role === "admin"
                                  ? "bg-amber-50 text-amber-600 border border-amber-200/60"
                                  : "bg-primary-50 text-primary-600 border border-primary-200/60"
                                  }`}
                              >
                                {u.role === "admin" ? (
                                  <Shield className="w-3 h-3" />
                                ) : (
                                  <Users className="w-3 h-3" />
                                )}
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs ${u.isActive ? "text-success-600" : "text-danger-600"}`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${u.isActive ? "bg-success-500" : "bg-danger-500"}`}
                                />
                                {u.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">
                                {u.points}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEditModal(u)}
                                  className="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-100 rounded-lg transition-all"
                                  title="Edit"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(u)}
                                  className="p-2 text-gray-400 hover:text-danger-500 hover:bg-gray-100 rounded-lg transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200/60">
                    <p className="text-sm text-gray-500">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="p-2 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="p-2 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {/* Reports Tab */}
          {activeTab === "reports" && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold text-surface-dark">Report Management</h1><p className="text-gray-500 text-sm mt-1">{reportsTotalItems} total reports</p></div>
                <button onClick={() => fetchReports()} className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl font-medium text-sm text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Refresh</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {reportStatCards.map((stat, i) => (
                  <div key={i} className="p-5 bg-white border border-gray-200/60 rounded-2xl hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3"><span className="text-sm text-gray-500">{stat.label}</span><div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center ${stat.text}`}>{stat.icon}</div></div>
                    <p className="text-2xl font-bold text-surface-dark">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <select value={reportStatusFilter} onChange={(e) => { setReportStatusFilter(e.target.value); setReportsPage(1); }} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-surface-dark text-sm focus:outline-none focus:border-primary-500 appearance-none cursor-pointer">
                  <option value="">All Status</option><option value="pending">Pending</option><option value="reviewing">Under Review</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option>
                </select>
                <select value={reportTypeFilter} onChange={(e) => { setReportTypeFilter(e.target.value); setReportsPage(1); }} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-surface-dark text-sm focus:outline-none focus:border-primary-500 appearance-none cursor-pointer">
                  <option value="">All Types</option><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="hate_speech">Hate Speech</option><option value="false_claim">False Claim</option><option value="misinformation">Misinformation</option><option value="inappropriate_content">Inappropriate Content</option><option value="other">Other</option>
                </select>
              </div>
              <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden shadow-sm">
                {reportsLoading ? (<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>) : reports.length === 0 ? (<div className="text-center py-20"><Flag className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-400">No reports found</p></div>) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b border-gray-200/60 bg-gray-50/50"><th className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">Title</th><th className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">Type</th><th className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">Reported By</th><th className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">Status</th><th className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">Target</th><th className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">Date</th><th className="text-right text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">Actions</th> </tr></thead>
                      <tbody>
                        {reports.map((report) => (
                          <tr key={report._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4"><div><p className="text-sm font-medium text-surface-dark truncate max-w-[200px]">{report.title}</p><p className="text-xs text-gray-400 truncate max-w-[200px]">{report.description?.substring(0, 50)}...</p></div> </td>
                            <td className="px-6 py-4"><span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium capitalize border ${getReasonColor(report.reason)}`}>{report.reason?.replace(/_/g, ' ')}</span> </td>
                            <td className="px-6 py-4"><span className="text-sm text-gray-600">{report.reporter?.name || report.reporter?.email || 'Unknown'}</span> </td>
                            <td className="px-6 py-4"><span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium capitalize border ${getStatusColor(report.status)}`}>{report.status}</span> </td>
                            <td className="px-6 py-4"><span className="text-xs text-gray-500 capitalize">{report.targetType}: {report.targetId?.slice(-6)}</span> </td>
                            <td className="px-6 py-4"><span className="text-sm text-gray-500">{formatDate(report.createdAt)}</span> </td>
                            <td className="px-6 py-4"><div className="flex items-center justify-end gap-1"><button onClick={() => openReportViewModal(report)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-gray-100 rounded-lg transition-all"><Eye className="w-4 h-4" /></button><button onClick={() => openReportStatusModal(report)} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-gray-100 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button><button onClick={() => openReportDeleteModal(report)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button></div> </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {reportsTotalPages > 1 && (<div className="flex items-center justify-between px-6 py-4 border-t border-gray-200/60"><p className="text-sm text-gray-500">Page {reportsPage} of {reportsTotalPages}</p><div className="flex gap-2"><button onClick={() => setReportsPage(p => Math.max(1, p - 1))} disabled={reportsPage === 1} className="p-2 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button><button onClick={() => setReportsPage(p => Math.min(reportsTotalPages, p + 1))} disabled={reportsPage === reportsTotalPages} className="p-2 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button></div></div>)}
              </div>
            </>
          )}

          {/* Matching Posts Tab */}
          {activeTab === "matching" && (
            <>
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-surface-dark flex items-center gap-2">
                    <GitMerge className="w-6 h-6 text-violet-500" /> Matching Posts
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Automatically detect and review potential lost ↔ found matches
                  </p>
                </div>
                <button
                  onClick={handleRunMatching}
                  disabled={matchRunning}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium text-sm hover:from-violet-600 hover:to-purple-700 transition-all shadow-md shadow-violet-500/20 flex items-center gap-2 self-start disabled:opacity-60"
                >
                  {matchRunning
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Zap className="w-4 h-4" />}
                  {matchRunning ? 'Scanning...' : 'Run Matching'}
                </button>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Pending Review', value: matchStats.pending, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
                  { label: 'Confirmed', value: matchStats.confirmed, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
                  { label: 'Dismissed', value: matchStats.dismissed, bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
                ].map((s) => (
                  <div key={s.label} className={`p-5 bg-white border ${s.border} rounded-2xl`}>
                    <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                    <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Status filter tabs */}
              <div className="flex gap-2 mb-5">
                {['pending', 'confirmed', 'dismissed'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setMatchStatusFilter(s)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all border ${matchStatusFilter === s
                      ? 'bg-violet-500 text-white border-violet-500 shadow-sm'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-violet-300 hover:text-violet-600'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Match list */}
              {matchesLoading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : matches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white border border-gray-200 rounded-2xl">
                  <GitMerge className="w-14 h-14 text-gray-200 mb-4" />
                  <p className="text-gray-400 font-medium">No {matchStatusFilter} matches</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Run Matching" to scan for potential pairs</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {matches.map((match, idx) => {
                    const lost = match.lostItem;
                    const found = match.foundItem;
                    const isActing = matchActionLoading === match._id;
                    const scoreLabel = `${match.score}/4`;
                    const confidencePct = Math.round((match.score / 4) * 100);
                    const confidenceColor = match.score === 4
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      : 'bg-amber-100 text-amber-700 border-amber-300';

                    return (
                      <div key={match._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {/* Top bar */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/60">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-700">Match #{String(idx + 1).padStart(4, '0')}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${confidenceColor}`}>
                              {scoreLabel} · {confidencePct}% Confidence
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{new Date(match.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>

                        {/* Side-by-side posts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                          {/* LOST POST */}
                          <div className="p-5">
                            <div className="flex items-center gap-1.5 mb-3">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Lost Post</span>
                            </div>
                            <div className="flex items-start gap-3 mb-4">
                              {lost?.images?.[0] ? (
                                <img src={`http://localhost:5000${lost.images[0]}`} alt={lost?.title}
                                  className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0" />
                              ) : (
                                <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                                  <Package className="w-6 h-6 text-red-200" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-gray-800 truncate">{lost?.title || '—'}</p>
                                <p className="text-xs text-gray-400 mt-0.5">by {lost?.postedBy?.fullName || 'Unknown'} · {lost?.postedBy?.studentId || ''}</p>
                              </div>
                            </div>
                            <div className="space-y-1 text-xs text-gray-500">
                              <p><span className="font-medium text-gray-600">Category:</span> {lost?.category || '—'}</p>
                              <p><span className="font-medium text-gray-600">Location:</span> {lost?.lastSeenLocation || '—'}</p>
                              <p><span className="font-medium text-gray-600">Date Lost:</span> {lost?.dateLost ? new Date(lost.dateLost).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</p>
                              {lost?.color && <p><span className="font-medium text-gray-600">Color:</span> {lost.color}</p>}
                              {lost?.brand && <p><span className="font-medium text-gray-600">Brand:</span> {lost.brand}</p>}
                            </div>
                          </div>

                          {/* FOUND POST */}
                          <div className="p-5 relative">
                            {/* Swap icon in centre on md+ */}
                            <div className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-violet-500 text-white items-center justify-center shadow-lg shadow-violet-500/30">
                              <ArrowLeftRight className="w-4 h-4" />
                            </div>
                            <div className="flex items-center gap-1.5 mb-3">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Found Post</span>
                            </div>
                            <div className="flex items-start gap-3 mb-4">
                              {found?.images?.[0] ? (
                                <img src={`http://localhost:5000${found.images[0]}`} alt={found?.title}
                                  className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0" />
                              ) : (
                                <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                                  <Package className="w-6 h-6 text-emerald-200" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-gray-800 truncate">{found?.title || '—'}</p>
                                <p className="text-xs text-gray-400 mt-0.5">by {found?.postedBy?.fullName || 'Unknown'} · {found?.postedBy?.studentId || ''}</p>
                              </div>
                            </div>
                            <div className="space-y-1 text-xs text-gray-500">
                              <p><span className="font-medium text-gray-600">Category:</span> {found?.category || '—'}</p>
                              <p><span className="font-medium text-gray-600">Location:</span> {found?.foundLocation || '—'}</p>
                              <p><span className="font-medium text-gray-600">Date Found:</span> {found?.dateFound ? new Date(found.dateFound).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</p>
                              {found?.color && <p><span className="font-medium text-gray-600">Color:</span> {found.color}</p>}
                              {found?.brand && <p><span className="font-medium text-gray-600">Brand:</span> {found.brand}</p>}
                            </div>
                          </div>
                        </div>

                        {/* Matched On tags + Actions */}
                        <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/40">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Matched on tags */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Matched on:</span>
                              {match.matchedOn?.map((attr) => (
                                <span key={attr} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-medium">
                                  <Check className="w-3 h-3" /> {attr}
                                </span>
                              ))}
                            </div>

                            {/* Actions */}
                            {matchStatusFilter === 'pending' && (
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleConfirmMatch(match._id)}
                                  disabled={isActing}
                                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-emerald-500/20 disabled:opacity-60"
                                >
                                  {isActing ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                  Confirm Match &amp; Notify Both
                                </button>
                                <button
                                  onClick={() => handleDismissMatch(match._id)}
                                  disabled={isActing}
                                  className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
                                >
                                  <X className="w-3.5 h-3.5" /> Dismiss
                                </button>
                              </div>
                            )}
                            {matchStatusFilter === 'confirmed' && (
                              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                                <CheckCircle className="w-3.5 h-3.5" /> Confirmed — Both users notified
                              </span>
                            )}
                            {matchStatusFilter === 'dismissed' && (
                              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
                                <XCircle className="w-3.5 h-3.5" /> Dismissed
                              </span>
                            )}
                          </div>
                          {matchStatusFilter === 'pending' && (
                            <p className="text-[10px] text-gray-400 mt-2">Admin review required before notification is sent</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Notices Tab */}
          {activeTab === "notices" && (

            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold text-surface-dark">Notice Management</h1><p className="text-gray-500 text-sm mt-1">{noticesTotalItems} total notices</p></div>
                <button onClick={openNoticeCreate} className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 self-start"><Plus className="w-4 h-4" /> Create Notice</button>
              </div>
              <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden shadow-sm">
                {noticesLoading ? (<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>) : notices.length === 0 ? (<div className="text-center py-20"><Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-400">No notices yet</p></div>) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b border-gray-200/60 bg-gray-50/50"><th className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">Notice</th><th className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">Category</th><th className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">Priority</th><th className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">Status</th><th className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">Expires</th><th className="text-right text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">Actions</th> </tr></thead>
                      <tbody>
                        {notices.map((n) => (
                          <tr key={n._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4"><div className="flex items-center gap-3">{n.attachments?.[0] && n.attachments[0].match(/\.(jpeg|jpg|gif|png|webp)$/i) ? <img src={`http://localhost:5000${n.attachments[0]}`} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0" /> : <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0"><Megaphone className="w-5 h-5 text-amber-300" /></div>}<div className="min-w-0"><p className="text-sm font-medium text-surface-dark truncate">{n.title}</p><p className="text-xs text-gray-400 truncate max-w-[200px]">{n.content}</p></div></div> </td>
                            <td className="px-6 py-4"><span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-200/60 rounded-lg text-xs font-medium capitalize">{n.category}</span> </td>
                            <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${n.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-200' : n.priority === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>{n.priority}</span> </td>
                            <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 text-xs ${n.isActive ? 'text-emerald-600' : 'text-gray-400'}`}><span className={`w-2 h-2 rounded-full ${n.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />{n.isActive ? 'Active' : 'Expired'}</span> </td>
                            <td className="px-6 py-4"><span className="text-sm text-gray-600">{formatDate(n.expiryDate)}</span> </td>
                            <td className="px-6 py-4"><div className="flex items-center justify-end gap-1"><button onClick={() => openNoticeEdit(n)} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-gray-100 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button><button onClick={() => { setSelectedNotice(n); setShowDeleteNotice(true); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button></div> </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {noticesTotalPages > 1 && (<div className="flex items-center justify-between px-6 py-4 border-t border-gray-200/60"><p className="text-sm text-gray-500">Page {noticesPage} of {noticesTotalPages}</p><div className="flex gap-2"><button onClick={() => setNoticesPage(p => Math.max(1, p - 1))} disabled={noticesPage === 1} className="p-2 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button><button onClick={() => setNoticesPage(p => Math.min(noticesTotalPages, p + 1))} disabled={noticesPage === noticesTotalPages} className="p-2 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button></div></div>)}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Create User Modal (your existing code) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-surface-dark">
                Create New User
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 font-medium mb-1.5">
                  Student ID
                </label>
                <input
                  type="text"
                  value={createForm.studentId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, studentId: e.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. IT23543964"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 font-medium mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={createForm.fullName}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, fullName: e.target.value })
                  }
                  className={inputClass}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 font-medium mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  className={inputClass}
                  placeholder="it23543964@my.sliit.lk"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 font-medium mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, password: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 font-medium mb-1.5">
                    Role
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, role: e.target.value })
                    }
                    className={selectClass}
                  >
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 font-medium mb-1.5">
                    Status
                  </label>
                  <select
                    value={createForm.isActive}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        isActive: e.target.value === "true",
                      })
                    }
                    className={selectClass}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-sm font-medium text-white hover:from-primary-600 hover:to-accent-600 transition-all shadow-md shadow-primary-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Create
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal (your existing code) */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-surface-dark">Edit User</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 font-medium mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, fullName: e.target.value })
                  }
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 font-medium mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 font-medium mb-1.5">
                  New Password{" "}
                  <span className="text-gray-400">(leave blank to keep)</span>
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                  className={inputClass}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 font-medium mb-1.5">
                    Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value })
                    }
                    className={selectClass}
                  >
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 font-medium mb-1.5">
                    Status
                  </label>
                  <select
                    value={editForm.isActive}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        isActive: e.target.value === "true",
                      })
                    }
                    className={selectClass}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 font-medium mb-1.5">
                  Points
                </label>
                <input
                  type="number"
                  value={editForm.points}
                  onChange={(e) =>
                    setEditForm({ ...editForm, points: Number(e.target.value) })
                  }
                  className={inputClass}
                  min="0"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-sm font-medium text-white hover:from-primary-600 hover:to-accent-600 transition-all shadow-md shadow-primary-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal (your existing code) */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-danger-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-danger-500" />
            </div>
            <h3 className="text-lg font-bold text-center text-surface-dark mb-2">
              Delete User?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-2">
              Are you sure you want to delete{" "}
              <span className="text-surface-dark font-medium">
                {selectedUser.fullName}
              </span>
              ?
            </p>
            <p className="text-xs text-gray-400 text-center mb-6">
              This action cannot be undone.
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

      {/* View Report Modal */}
      {showReportViewModal && selectedReport && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-bold text-surface-dark">Report Details</h3>
              </div>
              <button
                onClick={() => setShowReportViewModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Title</label>
                <p className="text-surface-dark font-medium mt-1">{selectedReport.title}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Description</label>
                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{selectedReport.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Report Type</label>
                  <p className="text-surface-dark mt-1 capitalize">{selectedReport.reportType}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Priority</label>
                  <p className="text-surface-dark mt-1 capitalize">{selectedReport.priority}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                  <span className={`inline-flex mt-1 px-2.5 py-1 rounded-lg text-xs font-medium capitalize border ${getStatusColor(selectedReport.status)}`}>
                    {selectedReport.status?.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Reported By</label>
                  <p className="text-surface-dark mt-1">
                    {selectedReport.isAnonymous ? "Anonymous" : selectedReport.reportedBy?.name}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Reported Item</label>
                <p className="text-surface-dark mt-1">
                  {selectedReport.reportedItemModel}: {selectedReport.reportedItemId}
                </p>
              </div>
              
              {selectedReport.adminNotes && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Admin Notes</label>
                  <p className="text-gray-600 mt-1 bg-gray-50 p-3 rounded-lg">{selectedReport.adminNotes}</p>
                </div>
              )}
              
              {selectedReport.resolution?.action && selectedReport.resolution.action !== 'none' && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Resolution Action</label>
                  <p className="text-surface-dark mt-1 capitalize">{selectedReport.resolution.action}</p>
                </div>
              )}
              
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Created At</label>
                <p className="text-gray-500 text-sm mt-1">{new Date(selectedReport.createdAt).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowReportViewModal(false);
                  openReportStatusModal(selectedReport);
                }}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-all"
              >
                Update Status
              </button>
              <button
                onClick={() => setShowReportViewModal(false)}
                className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Report Status Modal */}
      {showReportStatusModal && selectedReport && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-surface-dark">Update Report Status</h3>
              <button
                onClick={() => setShowReportStatusModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Status</label>
                <select
                  value={reportStatusUpdate.status}
                  onChange={(e) => setReportStatusUpdate({ ...reportStatusUpdate, status: e.target.value })}
                  className={selectClass}
                >
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Admin Notes</label>
                <textarea
                  value={reportStatusUpdate.adminNotes}
                  onChange={(e) => setReportStatusUpdate({ ...reportStatusUpdate, adminNotes: e.target.value })}
                  className={inputClass}
                  rows={3}
                  placeholder="Add notes about this report..."
                />
              </div>
              
              {reportStatusUpdate.status === 'resolved' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Resolution Action</label>
                  <select
                    value={reportStatusUpdate.resolutionAction}
                    onChange={(e) => setReportStatusUpdate({ ...reportStatusUpdate, resolutionAction: e.target.value })}
                    className={selectClass}
                  >
                    <option value="none">No Action</option>
                    <option value="warning">Warning Issued</option>
                    <option value="removed">Content Removed</option>
                    <option value="banned">User Banned</option>
                    <option value="restricted">User Restricted</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowReportStatusModal(false)}
                className="flex-1 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReportStatusUpdate}
                disabled={reportStatusLoading}
                className="flex-1 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-sm font-medium text-white hover:from-primary-600 hover:to-accent-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {reportStatusLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Report Modal */}
      {showReportDeleteModal && selectedReport && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-center text-surface-dark mb-2">
              Delete Report?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-2">
              Are you sure you want to delete this report?
            </p>
            <p className="text-xs text-gray-400 text-center mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReportDeleteModal(false)}
                className="flex-1 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReportDelete}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Notice Modal (your existing code) */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-xl w-full shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-surface-dark">{editingNotice ? 'Edit Notice' : 'Create Notice'}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{editingNotice ? 'Update notice details.' : 'Broadcast a new campus notice.'}</p>
              </div>
              <button onClick={() => setShowNoticeModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            {noticeFormError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" /> {noticeFormError}
              </div>
            )}
            <form onSubmit={handleNoticeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Title <span className="text-red-400">*</span></label>
                <input id="adm-notice-title" type="text" value={noticeForm.title} onChange={handleNoticeFormChange} className={inputClass} placeholder="Notice title" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Content <span className="text-red-400">*</span></label>
                <textarea id="adm-notice-content" value={noticeForm.content} onChange={handleNoticeFormChange} className={`${inputClass} resize-none`} rows={4} placeholder="Notice details..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Category</label>
                  <select id="adm-notice-category" value={noticeForm.category} onChange={handleNoticeFormChange} className={`${inputClass} capitalize`}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Priority</label>
                  <select id="adm-notice-priority" value={noticeForm.priority} onChange={handleNoticeFormChange} className={`${inputClass} capitalize`}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Expiry Date</label>
                  <input id="adm-notice-expiryDate" type="datetime-local" value={noticeForm.expiryDate} onChange={handleNoticeFormChange} className={inputClass} />
                </div>
                {editingNotice && (
                  <div className="flex items-center h-[46px] px-2 mb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input id="adm-notice-isActive" type="checkbox" checked={noticeForm.isActive} onChange={handleNoticeFormChange} className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500" />
                      <span className="text-sm font-medium text-gray-600">Active</span>
                    </label>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Attachments</label>
                <div onClick={() => noticeFileRef.current.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all">
                  <Image className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click to upload files</p>
                </div>
                <input ref={noticeFileRef} type="file" multiple accept=".jpeg,.jpg,.png,.gif,.webp,.pdf,.doc,.docx" className="hidden" onChange={handleNoticeFileChange} />
                {noticePreviews.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {noticePreviews.map((src, i) => src === 'document'
                      ? <div key={i} className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium">Doc {i+1}</div>
                      : <img key={i} src={src} alt={`preview-${i}`} className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNoticeModal(false)} className="flex-1 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" disabled={noticeFormLoading} className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {noticeFormLoading
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : editingNotice ? <><Save className="w-4 h-4" /> Save</> : <><Megaphone className="w-4 h-4" /> Broadcast</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Notice Modal (your existing code) */}
      {showDeleteNotice && selectedNotice && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-500" /></div>
            <h3 className="text-lg font-bold text-center text-surface-dark mb-2">Delete Notice?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">This notice will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteNotice(false)} className="flex-1 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-all">Cancel</button>
              <button onClick={handleNoticeDelete} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Matching Posts Tab is inserted above in the JSX ─────────────────────────
};

export default AdminDashboard;