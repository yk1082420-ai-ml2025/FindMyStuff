import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getSocket } from '../socket';
import API from '../api/axios';

const NotificationContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const { data } = await API.get('/notifications/unread-count');
            setUnreadCount(data.count);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            const { data } = await API.get('/notifications?limit=20');
            setNotifications(data.data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, []);

    const markAsRead = useCallback(async (id) => {
        try {
            await API.put(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await API.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    }, []);

    // Fetch on login
    useEffect(() => {
        if (user?._id) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchUnreadCount();
            fetchNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user, fetchUnreadCount, fetchNotifications]);

    // Listen for real-time notifications via Socket.IO
    useEffect(() => {
        if (!user?._id) return;

        const socket = getSocket();
        if (!socket) return;

        const handleNewNotification = (notification) => {
            setNotifications(prev => [notification, ...prev].slice(0, 20));
            setUnreadCount(prev => prev + 1);
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [user]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                fetchNotifications,
                fetchUnreadCount,
                markAsRead,
                markAllAsRead
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};
