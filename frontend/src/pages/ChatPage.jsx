import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../socket';
import API from '../api/axios';
import ChatWindow from '../components/Chat/ChatWindow';
import ChatList from '../components/chat/ChatList';

const ChatPage = () => {
    useAuth();
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [loading, setLoading] = useState(true);
    const socket = getSocket();

    // Fetch chats
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const response = await API.get('/chats');
                setChats(response.data.data || []);
            } catch (error) {
                console.error('Failed to fetch chats:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchChats();
    }, []);

    // Listen for new message notifications
    useEffect(() => {
        if (!socket) return;
        
        const handleNewMessageNotification = (notification) => {
            console.log('New message notification:', notification);
            // Update chat list to show unread count
            setChats(prev => prev.map(chat => 
                chat._id === notification.chatId 
                    ? { ...chat, unreadCount: (chat.unreadCount || 0) + 1, lastMessage: notification.message.content }
                    : chat
            ));
        };
        
        socket.on('new_message_notification', handleNewMessageNotification);
        
        return () => {
            socket.off('new_message_notification');
        };
    }, [socket]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-16">
            <div className="container mx-auto h-[calc(100vh-4rem)]">
                <div className="flex h-full bg-white shadow-lg rounded-lg overflow-hidden">
                    {/* Chat List */}
                    <div className="w-80 border-r border-gray-200">
                        <ChatList 
                            chats={chats} 
                            selectedChat={selectedChat}
                            onSelectChat={setSelectedChat}
                        />
                    </div>
                    
                    {/* Chat Window */}
                    <div className="flex-1">
                        {selectedChat ? (
                            <ChatWindow 
                                chat={selectedChat} 
                                onBack={() => setSelectedChat(null)}
                                socket={socket}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="text-center">
                                    <p className="text-lg mb-2">No chat selected</p>
                                    <p className="text-sm">Select a conversation to start messaging</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;