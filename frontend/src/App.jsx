import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { initializeSocket, disconnectSocket } from './socket';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LostItems from './pages/LostItems';
import FoundItems from './pages/FoundItems';
import Notices from './pages/Notices';
import ChatBot from './pages/ChatBot';
import Leaderboard from './pages/Leaderboard';

const AuthRedirect = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
};

// SocketInitializer component
const SocketInitializer = ({ children }) => {
  const { user } = useAuth();

  useEffect(() => {
    let socket = null;

    if (user?._id) {
      console.log('🟡 App: Initializing socket for user:', user._id);
      socket = initializeSocket(user._id);
      console.log('🟢 App: Socket after init:', socket?.id);
    }

    return () => {
      if (user?._id) {
        console.log('🔴 App: Disconnecting socket for user:', user._id);
        disconnectSocket();
      }
    };
  }, [user]);

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <SocketInitializer>
<<<<<<< HEAD
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
            <Route path="/register" element={<AuthRedirect><Register /></AuthRedirect>} />
            <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/chat" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/lost" element={<LostItems />} />
            <Route path="/found-items" element={<FoundItems />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/chatbot" element={<ChatBot />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ChatBot />
=======
          <NotificationProvider>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
              <Route path="/register" element={<AuthRedirect><Register /></AuthRedirect>} />
              <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
              <Route path="/chat" element={<Navigate to="/dashboard" replace />} />
              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
              <Route path="/lost" element={<LostItems />} />
              <Route path="/found-items" element={<FoundItems />} />
              <Route path="/notices" element={<Notices />} />
              <Route path="/chatbot" element={<ChatBot />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <ChatBot />
          </NotificationProvider>
>>>>>>> 9fc9740e0a54c8bc823eda0ffd93750894967bf0
        </SocketInitializer>
      </Router>
    </AuthProvider>
  );
}

export default App;