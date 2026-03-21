import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';

const ChatPage = () => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [selectedChat, setSelectedChat] = useState(null);
    const [chatRefreshCounter, setChatRefreshCounter] = useState(0);

    useEffect(() => {
        if (!user?.token) return;

        const newSocket = io('http://localhost:5000', {
            auth: {
                token: user.token
            }
        });

        setSocket(newSocket);

        // When receiving a new message while not looking at that chat, 
        // we might want to refresh the chat list to bump it up.
        newSocket.on('receive_message', (message) => {
            // Trigger a refresh of the chat list
            setChatRefreshCounter(prev => prev + 1);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user?.token]);

    const handleSelectChat = (chat) => {
        setSelectedChat(chat);
    };

    return (
        <div className="pt-16 min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Sidebar for Chat List */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white shadow-sm flex-shrink-0 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`} style={{ height: 'calc(100vh - 64px)' }}>
                <ChatList 
                    selectedChat={selectedChat} 
                    onSelectChat={handleSelectChat} 
                    refreshTrigger={chatRefreshCounter}
                />
            </div>

            {/* Main Content for Chat Window */}
            <div className={`flex-1 bg-gray-50 flex flex-col relative ${!selectedChat ? 'hidden md:flex' : 'flex'}`} style={{ height: 'calc(100vh - 64px)' }}>
                {selectedChat ? (
                    <ChatWindow 
                        chat={selectedChat} 
                        socket={socket} 
                        onBack={() => setSelectedChat(null)}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">💬</span>
                        </div>
                        <h3 className="text-xl font-medium text-gray-700">Your Messages</h3>
                        <p className="mt-2 text-sm">Select a conversation from the sidebar to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
