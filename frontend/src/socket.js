import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;

export const initializeSocket = (userId) => {
    console.log('🟡 Initializing socket for user:', userId);
    
    // If socket already exists and connected, return it
    if (socket && socket.connected) {
        console.log('🟢 Socket already connected:', socket.id);
        return socket;
    }
    
    // If socket exists but disconnected, create new one
    if (socket) {
        console.log('🔵 Socket exists but disconnected, creating new one');
        socket = null;
    }
    
    console.log('🔵 Creating new socket connection to:', SOCKET_URL);
    
    // Create new socket connection
    socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000
    });
    
    // Socket event handlers
    socket.on('connect', () => {
        console.log('✅✅✅ SOCKET CONNECTED! ID:', socket.id);
        if (userId) {
            socket.emit('setup', userId);
            console.log('📡 User joined room:', userId);
        }
        // Update window for debugging
        if (typeof window !== 'undefined') {
            window.__socket = socket;
        }
    });
    
    socket.on('connect_error', (error) => {
        console.error('❌❌❌ SOCKET CONNECTION ERROR:', error.message);
        console.error('Make sure backend is running on port 5000');
    });
    
    socket.on('disconnect', (reason) => {
        console.log('🔴 Socket disconnected:', reason);
    });
    
    socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
        if (userId) {
            socket.emit('setup', userId);
        }
    });
    
    // Expose to window for debugging
    if (typeof window !== 'undefined') {
        window.__socket = socket;
    }
    
    return socket;
};

export const getSocket = () => {
    if (!socket) {
        console.warn('⚠️ Socket not initialized yet. Will be created when user logs in.');
        return null;
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        console.log('🔌 Disconnecting socket...');
        socket.disconnect();
        socket = null;
        if (typeof window !== 'undefined') {
            window.__socket = null;
        }
        console.log('Socket disconnected');
    }
};