import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket, initializeSocket } from '../socket';
import API from '../api/axios';

const TestChat = () => {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [socketStatus, setSocketStatus] = useState('Checking...');
    const [socketId, setSocketId] = useState(null);
    const [socket, setSocket] = useState(null);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Initialize socket in TestChat
    useEffect(() => {
        if (!user?._id) return;
        
        console.log('TestChat: Setting up socket for user:', user._id);
        
        let existingSocket = getSocket();
        
        if (!existingSocket) {
            console.log('TestChat: No socket exists, creating new one');
            existingSocket = initializeSocket(user._id);
        }
        
        if (existingSocket) {
            setSocket(existingSocket);
            setSocketStatus(existingSocket.connected ? 'Connected' : 'Connecting...');
            setSocketId(existingSocket.id);
            
            const onConnect = () => {
                console.log('✅ TestChat: Socket connected!');
                setSocketStatus('Connected');
                setSocketId(existingSocket.id);
            };
            
            const onDisconnect = () => {
                console.log('❌ TestChat: Socket disconnected');
                setSocketStatus('Disconnected');
                setSocketId(null);
            };
            
            const onConnectError = (err) => {
                console.error('TestChat: Socket error:', err);
                setSocketStatus('Error: ' + err.message);
            };
            
            existingSocket.on('connect', onConnect);
            existingSocket.on('disconnect', onDisconnect);
            existingSocket.on('connect_error', onConnectError);
            
            return () => {
                existingSocket.off('connect', onConnect);
                existingSocket.off('disconnect', onDisconnect);
                existingSocket.off('connect_error', onConnectError);
            };
        } else {
            setSocketStatus('Failed to initialize');
        }
    }, [user]);

    // Fetch chats
    useEffect(() => {
        const fetchChats = async () => {
            if (!user) return;
            try {
                console.log('Fetching chats...');
                const response = await API.get('/chats');
                console.log('Chats response:', response.data);
                setChats(response.data.data || []);
            } catch (error) {
                console.error('Error fetching chats:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchChats();
    }, [user]);

    // Fetch messages when chat selected
    useEffect(() => {
        if (!selectedChat) return;
        
        const fetchMessages = async () => {
            try {
                console.log('Fetching messages for chat:', selectedChat._id);
                const response = await API.get(`/messages/${selectedChat._id}`);
                setMessages(response.data.data || []);
                scrollToBottom();
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };
        
        fetchMessages();
    }, [selectedChat]);

    // Listen for new messages via socket
    useEffect(() => {
        if (!socket) return;
        
        const handleNewMessage = (message) => {
            console.log('📨 New message via socket:', message);
            if (selectedChat && message.chatId === selectedChat._id) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
            }
        };
        
        socket.on('message_received', handleNewMessage);
        
        return () => {
            socket.off('message_received', handleNewMessage);
        };
    }, [socket, selectedChat]);

    // Send message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat) return;
        
        console.log('Sending message:', newMessage);
        
        try {
            const response = await API.post('/messages', {
                chatId: selectedChat._id,
                content: newMessage,
                type: 'TEXT'
            });
            
            const message = response.data.data;
            console.log('📤 Message sent:', message);
            setMessages(prev => [...prev, message]);
            setNewMessage('');
            scrollToBottom();
            
            if (socket && socket.connected) {
                socket.emit('new_message', message);
                console.log('📡 Emitted new_message via socket');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message: ' + (error.response?.data?.message || error.message));
        }
    };

    // Edit message
    const handleEditMessage = async (messageId, currentContent) => {
        const newContent = prompt('Edit message:', currentContent);
        if (!newContent || newContent === currentContent) return;
        
        try {
            const response = await API.put(`/messages/${messageId}/edit`, { content: newContent });
            const updatedMessage = response.data.data;
            
            setMessages(prev => prev.map(msg => 
                msg._id === messageId ? { ...updatedMessage, isEdited: true } : msg
            ));
            setEditingMessageId(null);
            setEditContent('');
        } catch (error) {
            console.error('Edit failed:', error);
            alert(error.response?.data?.message || 'Failed to edit message');
        }
    };

    // Delete message
    const handleDeleteMessage = async (messageId) => {
        if (!confirm('Are you sure you want to delete this message?')) return;
        
        try {
            await API.delete(`/messages/${messageId}/delete`);
            setMessages(prev => prev.map(msg => 
                msg._id === messageId 
                    ? { ...msg, isDeleted: true, content: '[Message deleted by user]' }
                    : msg
            ));
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete message');
        }
    };

    // Create new chat
    const createChat = async () => {
        const otherUserId = prompt('Enter the other user ID:');
        if (!otherUserId) return;
        
        console.log('Creating chat with user:', otherUserId);
        
        try {
            const response = await API.post('/chats', {
                itemId: 'chat_' + Date.now(),
                itemType: 'found',
                otherUserId: otherUserId
            });
            
            console.log('Chat created:', response.data);
            setChats(prev => [...prev, response.data.data]);
            setSelectedChat(response.data.data);
        } catch (error) {
            console.error('Error creating chat:', error);
            alert('Failed to create chat: ' + (error.response?.data?.message || error.message));
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-16">
            <div className="container mx-auto p-4">
                {/* Socket Status Bar */}
                <div className="mb-4 p-3 bg-white rounded-lg shadow text-center text-sm border">
                    <span className="font-semibold">Socket: </span>
                    <span className={`font-mono ${socketStatus === 'Connected' ? 'text-green-600' : 'text-red-600'}`}>
                        {socketStatus}
                    </span>
                    {socketId && (
                        <span className="ml-2 text-gray-500 text-xs">
                            (ID: {socketId})
                        </span>
                    )}
                    <span className="ml-4 text-gray-500">
                        User: {user?.fullName} ({user?._id})
                    </span>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
                    <div className="flex h-full">
                        {/* Chat List */}
                        <div className="w-80 border-r border-gray-200 flex flex-col">
                            <div className="p-4 border-b border-gray-200">
                                <button
                                    onClick={createChat}
                                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
                                >
                                    + New Chat
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {chats.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                        No chats yet. Click "New Chat" to start.
                                    </div>
                                ) : (
                                    chats.map(chat => (
                                        <div
                                            key={chat._id}
                                            onClick={() => setSelectedChat(chat)}
                                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                                                selectedChat?._id === chat._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                            }`}
                                        >
                                            <div className="font-semibold text-gray-800">
                                                {chat.otherUser?.fullName || 'Unknown User'}
                                            </div>
                                            <div className="text-sm text-gray-500 truncate">
                                                {chat.lastMessage || 'No messages yet'}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Chat Window */}
                        <div className="flex-1 flex flex-col">
                            {selectedChat ? (
                                <>
                                    <div className="p-4 border-b border-gray-200 bg-white">
                                        <h2 className="font-semibold text-gray-800">
                                            Chat with {selectedChat.otherUser?.fullName}
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Chat ID: {selectedChat._id}
                                        </p>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {messages.length === 0 ? (
                                            <div className="text-center text-gray-500 mt-20">
                                                No messages yet. Send a message to start.
                                            </div>
                                        ) : (
                                            messages.map((msg) => {
                                                const senderId = msg.senderId?._id || msg.senderId;
                                                const isOwn = senderId === user?._id;
                                                
                                                // Deleted message view
                                                if (msg.isDeleted) {
                                                    return (
                                                        <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                            <div className="max-w-[70%] bg-gray-100 rounded-lg px-4 py-2">
                                                                <p className="text-sm text-gray-500 italic">{msg.content}</p>
                                                                <span className="text-xs text-gray-400">
                                                                    {new Date(msg.createdAt).toLocaleTimeString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                
                                                return (
                                                    <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
                                                        <div className="relative max-w-[70%]">
                                                            {/* Message Bubble */}
                                                            <div className={`rounded-lg px-4 py-2 ${
                                                                isOwn
                                                                    ? 'bg-blue-500 text-white'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {editingMessageId === msg._id ? (
                                                                    <div className="space-y-2">
                                                                        <textarea
                                                                            value={editContent}
                                                                            onChange={(e) => setEditContent(e.target.value)}
                                                                            className="w-full p-2 border rounded-lg text-gray-800 text-sm"
                                                                            rows="2"
                                                                            autoFocus
                                                                        />
                                                                        <div className="flex gap-2 justify-end">
                                                                            <button
                                                                                onClick={() => handleEditMessage(msg._id, editContent)}
                                                                                className="px-3 py-1 bg-green-500 text-white rounded text-xs"
                                                                            >
                                                                                Save
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setEditingMessageId(null);
                                                                                    setEditContent('');
                                                                                }}
                                                                                className="px-3 py-1 bg-gray-500 text-white rounded text-xs"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <p className="text-sm break-words">{msg.content}</p>
                                                                        <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
                                                                            {new Date(msg.createdAt).toLocaleTimeString()}
                                                                            {msg.isEdited && ' (edited)'}
                                                                        </p>
                                                                    </>
                                                                )}
                                                            </div>
                                                            
                                                            {/* EDIT/DELETE BUTTONS */}
                                                            {!selectedChat?.isLocked && isOwn && editingMessageId !== msg._id && !msg.isDeleted && (
                                                                <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white shadow-lg rounded-lg p-1 border z-10">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingMessageId(msg._id);
                                                                            setEditContent(msg.content);
                                                                        }}
                                                                        className="p-1 hover:bg-blue-50 rounded text-blue-600 text-sm"
                                                                        title="Edit message"
                                                                    >
                                                                        ✏️ Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteMessage(msg._id)}
                                                                        className="p-1 hover:bg-red-50 rounded text-red-600 text-sm"
                                                                        title="Delete message"
                                                                    >
                                                                        🗑️ Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    <div className="p-4 border-t border-gray-200 bg-white">
                                        <form onSubmit={handleSendMessage} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Type a message..."
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!newMessage.trim()}
                                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition"
                                            >
                                                Send
                                            </button>
                                        </form>
                                        <p className="text-xs text-gray-400 mt-2 text-center">
                                            Messages can be edited within 5 minutes of sending
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-500">
                                    <div className="text-center">
                                        <p className="text-lg mb-2">No chat selected</p>
                                        <p className="text-sm">Click "New Chat" to start a conversation</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestChat;