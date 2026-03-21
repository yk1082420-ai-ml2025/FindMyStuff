import { useState, useEffect } from 'react';
import { getUserChats } from '../../api/chat';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { User, Lock } from 'lucide-react';

const ChatList = ({ selectedChat, onSelectChat, refreshTrigger }) => {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const data = await getUserChats();
                // Assumes backend returns an array of chat objects
                setChats(data);
            } catch (error) {
                console.error('Failed to fetch chats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchChats();
    }, [refreshTrigger]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (chats.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500">
                <span className="text-3xl mb-4">📭</span>
                <p>No messages yet.</p>
                <p className="text-sm mt-2 text-gray-400">Chats will appear here when you or others inquire about an item.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto">
            <h2 className="text-xl font-bold bg-white text-gray-800 p-4 border-b border-gray-100 flex items-center gap-2">
                 Messages 
                 <span className="text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-medium">{chats.length}</span>
            </h2>
            <div className="divide-y divide-gray-100">
                {chats.map((chat) => {
                    // Find the other participant in the chat
                    const otherUser = chat.otherUser;
                    const isSelected = selectedChat?._id === chat._id;
                    const lastMsg = chat.lastMessage;

                    return (
                        <div 
                            key={chat._id}
                            onClick={() => onSelectChat(chat)}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-3 ${isSelected ? 'bg-primary-50 border-l-4 border-primary-500' : 'border-l-4 border-transparent'}`}
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 flex-shrink-0 relative">
                                {otherUser?.fullName ? otherUser.fullName.charAt(0).toUpperCase() : <User />}
                                {chat.isLocked && (
                                    <div className="absolute -bottom-1 -right-1 bg-gray-500 rounded-full p-1 border-2 border-white">
                                        <Lock className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h4 className={`font-medium truncate ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
                                        {otherUser?.fullName || 'Unknown User'}
                                    </h4>
                                    {lastMsg && lastMsg.createdAt && (
                                        <span className="text-xs text-gray-400 flex-shrink-0">
                                            {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: true })}
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <p className={`text-sm truncate ${lastMsg?.content ? 'text-gray-600' : 'text-gray-400 italic'}`}>
                                        {lastMsg?.content || 'No messages yet'}
                                    </p>
                                    
                                    {/* Unread indicator could go here if the backend supports it */}
                                </div>
                                {chat.item && (
                                    <p className="text-xs text-primary-600 truncate mt-1">
                                        Re: {chat.item.name || chat.item.category || 'Item'}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ChatList;
