import { useState, useEffect, useRef } from 'react';
import { getChat } from '../../api/chat';
import { sendMessage, markMessagesAsRead } from '../../api/message';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { ArrowLeft, Send, Image as ImageIcon, Info, Lock } from 'lucide-react';

const ChatWindow = ({ chat, socket, onBack }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const otherUser = chat.otherUser || chat.users?.find(u => u._id !== user?._id) || chat.users?.[0];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchMessages = async () => {
            if (!chat?._id) return;
            setLoading(true);
            try {
                // If the backend GET /chats/:id returns { chat: {...}, messages: [...] }
                // or just the chat object with populated messages. Adjust accordingly.
                const data = await getChat(chat._id);
                setMessages(data.messages || data || []);
                
                // Note: The original bulk mark-read route is not present in the backend. 
                // We skip marking read here to prevent 404 errors.
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            } finally {
                setLoading(false);
                scrollToBottom();
            }
        };

        fetchMessages();

        // Join socket room for this chat
        if (socket && chat?._id) {
            socket.emit('setup', user); // Often you'd emit setup on socket connect, but here or in ChatPage
            socket.emit('join_chat', chat._id);

            const messageReceiver = (newMessageReceived) => {
                if (!chat._id || chat._id !== newMessageReceived.chat._id) {
                    // message belongs to another chat
                } else {
                    setMessages((prev) => [...prev, newMessageReceived]);
                    scrollToBottom();
                }
            };

            socket.on('message_received', messageReceiver);

            return () => {
                socket.off('message_received', messageReceiver);
                socket.emit('leave_chat', chat._id);
            };
        }
    }, [chat?._id, socket, user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || chat.isLocked) return;

        try {
            const data = await sendMessage({
                chatId: chat._id,
                content: newMessage,
            });

            // Update local state and emit socket event
            setMessages((prev) => [...prev, data]);
            setNewMessage('');
            
            if (socket) {
                socket.emit('new_message', data);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 h-full bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                <p className="mt-4 text-gray-500">Loading conversation...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onBack}
                        className="p-2 md:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold">
                        {otherUser?.fullName ? otherUser.fullName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">{otherUser?.fullName || 'User'}</h3>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                            {chat.item ? `Inquiring about: ${chat.item.name || chat.item.category}` : 'General Inquiry'}
                        </p>
                    </div>
                </div>
                
                {chat.isLocked && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium border border-gray-200">
                        <Lock className="w-4 h-4" />
                        <span>Closed</span>
                    </div>
                )}
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {chat.isLocked && (
                    <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm text-center flex items-center justify-center gap-2 mb-4 mx-4 border border-blue-100">
                        <Info className="w-4 h-4 flex-shrink-0" />
                        <p>This conversation is locked because the item has been returned.</p>
                    </div>
                )}
                
                {messages.length === 0 && !chat.isLocked && (
                    <div className="text-center text-gray-400 my-10 py-10">
                        <p className="mb-2">Send a message to start the conversation.</p>
                        <p className="text-sm">Never share sensitive personal info like passwords.</p>
                    </div>
                )}

                {messages.map((msg, index) => {
                    const isSender = msg.sender?._id === user?._id || msg.sender === user?._id;
                    const showTime = index === 0 || 
                        new Date(msg.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 10 * 60 * 1000;
                    
                    return (
                        <div key={msg._id || index} className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
                            {showTime && (
                                <div className="text-xs text-gray-400 mb-2 mt-4 mx-auto font-medium">
                                    {format(new Date(msg.createdAt || Date.now()), "MMM d, h:mm a")}
                                </div>
                            )}
                            <div className={`max-w-[75%] md:max-w-[70%] lg:max-w-[60%] rounded-2xl px-4 py-2.5 shadow-sm relative group ${
                                isSender 
                                    ? 'bg-gradient-to-br from-primary-500 to-accent-600 text-white rounded-tr-none' 
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                            }`}>
                                <p className="text-sm md:text-base break-words leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} className="h-1 pb-4" />
            </div>

            {/* Input Area */}
            <div className="bg-white p-3 md:p-4 border-t border-gray-200 sticky bottom-0 z-10">
                {chat.isLocked ? (
                    <div className="bg-gray-50 border border-gray-200 text-gray-500 rounded-xl p-3 text-center text-sm flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4" /> This chat is read-only
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <button 
                            type="button"
                            className="p-3 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-colors flex-shrink-0"
                            title="Send Image (Coming Soon)"
                        >
                            <ImageIcon className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm md:text-base placeholder-gray-400"
                        />
                        <button 
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-primary-500 disabled:bg-primary-300 hover:bg-primary-600 text-white p-3 rounded-xl transition-colors flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary-500/20 disabled:shadow-none"
                        >
                            <Send className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ChatWindow;
