import { useEffect, useState } from 'react';
import { MessageCircle, Package, Lock } from 'lucide-react';
import { getMyChats } from '../../api/claims';

const formatTime = (d) => {
    if (!d) return '';
    const now = new Date();
    const dt = new Date(d);
    const diff = (now - dt) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ChatList = ({ selectedChatId, onSelectChat }) => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getMyChats();
                setChats(res.data || []);
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        };
        load();
        const interval = setInterval(load, 15000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return (  //
        <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
        </div>
    );

    if (chats.length === 0) return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <MessageCircle className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-semibold text-gray-400">No conversations yet</p>
            <p className="text-xs text-gray-300 mt-1">When a claim is approved, a chat will appear here.</p>
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {chats.map(chat => {
                const isSelected = chat._id === selectedChatId;
                const isLocked = chat.status === 'LOCKED';
                const itemImg = chat.item?.images?.[0];

                return (
                    <button
                        key={chat._id}
                        onClick={() => onSelectChat(chat)}
                        className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all hover:bg-gray-50 ${isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''}`}
                    >
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                            {itemImg
                                ? <img src={`http://localhost:5000${itemImg}`} alt="" className="w-full h-full object-cover" />
                                : <Package className="w-5 h-5 text-gray-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <p className="text-sm font-semibold text-gray-800 truncate">
                                    {chat.otherUser?.fullName || 'User'}
                                </p>
                                <span className="text-[10px] text-gray-400 shrink-0 ml-1">{formatTime(chat.lastMessageAt)}</span>
                            </div>
                            <p className="text-xs text-gray-400 truncate">{chat.item?.title || 'Item'}</p>
                            <p className="text-xs text-gray-300 truncate mt-0.5">{chat.lastMessage || 'No messages yet'}</p>
                        </div>
                        {isLocked && (
                            <span className="flex items-center gap-1 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                                <Lock className="w-2.5 h-2.5" /> Closed
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default ChatList;
