import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Send, Lock, Edit2, Trash2, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import API from '../../api/axios';
import { getSocket } from '../../socket';

const ChatWindow = ({ chat, onBack }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const messagesEndRef = useRef(null);
    const socket = getSocket();
    const otherUser = chat.otherUser || chat.users?.find(u => u._id !== user?._id) || chat.users?.[0];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Fetch messages
    useEffect(() => {
        const fetchMessages = async () => {
            if (!chat?._id) return;
            try {
                const response = await API.get(`/messages/${chat._id}`);
                setMessages(response.data.data || []);
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            } finally {
                setLoading(false);
                scrollToBottom();
            }
        };

        fetchMessages();
        
        if (socket && chat?._id) {
            socket.emit('join_chat', chat._id);
        }
        
        return () => {
            if (socket && chat?._id) {
                socket.emit('leave_chat', chat._id);
            }
        };
    }, [chat?._id]);

    // Listen for new messages
    useEffect(() => {
        if (!socket) return;
        
        const handleNewMessage = (newMessage) => {
            setMessages(prev => [...prev, newMessage]);
            scrollToBottom();
        };
        
        socket.on('message_received', handleNewMessage);
        return () => socket.off('message_received');
    }, [socket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Send message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || chat.isLocked) return;

        setSending(true);
        
        try {
            const response = await API.post('/messages', {
                chatId: chat._id,
                content: newMessage,
                type: 'TEXT'
            });
            
            const savedMessage = response.data.data;
            setMessages(prev => [...prev, savedMessage]);
            setNewMessage('');
            scrollToBottom();
            
            if (socket) {
                socket.emit('new_message', savedMessage);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            alert(error.response?.data?.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    // Edit message
    const handleEditMessage = async (messageId, newContent) => {
        if (!newContent.trim()) return;
        
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
        if (!confirm('Delete this message?')) return;
        
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

    // Get sender ID
    const getSenderId = (msg) => {
        if (msg.senderId?._id) return msg.senderId._id;
        if (msg.senderId) return msg.senderId;
        if (msg.sender?._id) return msg.sender._id;
        if (msg.sender) return msg.sender;
        return null;
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 md:hidden text-gray-500 hover:text-gray-700 rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold">
                        {otherUser?.fullName ? otherUser.fullName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">{otherUser?.fullName || 'User'}</h3>
                        <p className="text-xs text-green-500 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
                {chat.isLocked && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">
                        <Lock className="w-4 h-4" />
                        <span>Closed</span>
                    </div>
                )}
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 mt-20">
                        <p>No messages yet. Send a message to start.</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const senderId = getSenderId(msg);
                    const isOwn = senderId === user?._id;
                    
                    // Deleted message view
                    if (msg.isDeleted) {
                        return (
                            <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className="max-w-[70%] bg-gray-100 rounded-lg px-4 py-2">
                                    <p className="text-sm text-gray-500 italic">{msg.content}</p>
                                    <span className="text-xs text-gray-400">
                                        {format(new Date(msg.createdAt), 'h:mm a')}
                                    </span>
                                </div>
                            </div>
                        );
                    }
                    
                    return (
                        <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-[70%] relative">
                                {/* Message Bubble */}
                                <div className={`rounded-2xl px-4 py-2 shadow-sm ${
                                    isOwn 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-white text-gray-800 border border-gray-200'
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
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className={`text-xs ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                                                    {format(new Date(msg.createdAt), 'h:mm a')}
                                                </span>
                                                {msg.isEdited && <span className="text-xs">(edited)</span>}
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                {/* EDIT/DELETE BUTTONS - ALWAYS VISIBLE ON HOVER */}
                                {!chat.isLocked && isOwn && editingMessageId !== msg._id && !msg.isDeleted && (
                                    <div className="absolute -top-8 right-0 flex gap-1 bg-white shadow-lg rounded-lg p-1 border z-10">
                                        <button
                                            onClick={() => {
                                                setEditingMessageId(msg._id);
                                                setEditContent(msg.content);
                                            }}
                                            className="p-1 hover:bg-blue-50 rounded text-blue-600"
                                            title="Edit message"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteMessage(msg._id)}
                                            className="p-1 hover:bg-red-50 rounded text-red-600"
                                            title="Delete message"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white p-4 border-t border-gray-200">
                {chat.isLocked ? (
                    <div className="bg-gray-100 text-gray-500 rounded-xl p-3 text-center text-sm">
                        <Lock className="w-4 h-4 inline mr-1" /> This chat is read-only
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500"
                        />
                        <button 
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="bg-blue-500 disabled:bg-blue-300 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-colors"
                        >
                            {sending ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </form>
                )}
                {!chat.isLocked && (
                    <p className="text-xs text-gray-400 mt-2 text-center">
                        Messages can be edited within 5 minutes of sending
                    </p>
                )}
            </div>
        </div>
    );
};

export default ChatWindow;