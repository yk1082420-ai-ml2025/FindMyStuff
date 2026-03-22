import { useState } from 'react';
import { Edit2, Trash2, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { editMessage, deleteMessage } from '../../api/chat';

const MessageBubble = ({ 
    message, 
    isOwn, 
    onMessageUpdate, 
    onMessageDelete, 
    showTime,
    previousMessage,
    isLocked 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message?.content || '');
    const [showActions, setShowActions] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditingMsg, setIsEditingMsg] = useState(false);

    // Guard against missing message
    if (!message) {
        console.error('MessageBubble: message prop is missing');
        return null;
    }

    // Debug log
    console.log('MessageBubble render:', {
        messageId: message._id,
        hasContent: !!message.content,
        isOwn,
        isLocked
    });

    // Check if message can be edited (within 5 minutes)
    const canEdit = () => {
        try {
            if (!isOwn) return false;
            if (message.type === 'SYSTEM') return false;
            if (message.isDeleted) return false;
            if (isLocked) return false;
            
            const now = new Date();
            const messageTime = new Date(message.createdAt);
            // Check if date is valid
            if (isNaN(messageTime.getTime())) return false;
            
            const diffMinutes = (now - messageTime) / (1000 * 60);
            return diffMinutes <= 5;
        } catch (error) {
            console.error('Error in canEdit:', error);
            return false;
        }
    };

    // Format time safely
    const formatTime = (date) => {
        try {
            if (!date) return '';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            return format(d, 'h:mm a');
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            return '';
        }
    };

    // Format full date safely
    const formatFullDate = (date) => {
        try {
            if (!date) return '';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            return format(d, "MMM d, h:mm a");
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            return '';
        }
    };

    // Handle edit
    const handleEdit = async () => {
        if (!editContent.trim()) {
            alert('Message cannot be empty');
            return;
        }
        
        if (editContent === message.content) {
            setIsEditing(false);
            return;
        }

        setIsEditingMsg(true);
        try {
            const response = await editMessage(message._id, editContent);
            if (onMessageUpdate) {
                onMessageUpdate(response.data);
            }
            setIsEditing(false);
        } catch (error) {
            console.error('Edit failed:', error);
            alert(error.response?.data?.message || 'Failed to edit message');
        } finally {
            setIsEditingMsg(false);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this message?')) return;
        
        setIsDeleting(true);
        try {
            await deleteMessage(message._id);
            if (onMessageDelete) {
                onMessageDelete(message._id);
            }
        } catch (error) {
            console.error('Delete failed:', error);
            alert(error.response?.data?.message || 'Failed to delete message');
        } finally {
            setIsDeleting(false);
        }
    };

    // Check if we should show timestamp
    const shouldShowTime = () => {
        try {
            if (showTime) return true;
            if (!previousMessage) return true;
            if (!message.createdAt) return true;
            
            const currentTime = new Date(message.createdAt).getTime();
            const prevTime = new Date(previousMessage.createdAt).getTime();
            if (isNaN(currentTime) || isNaN(prevTime)) return true;
            
            return (currentTime - prevTime) > 10 * 60 * 1000;
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            return true;
        }
    };

    // Show deleted message
    if (message.isDeleted) {
        return (
            <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                {shouldShowTime() && (
                    <div className="text-xs text-gray-400 mb-2 mt-4 mx-auto font-medium">
                        {formatFullDate(message.createdAt)}
                    </div>
                )}
                <div className={`max-w-[75%] md:max-w-[70%] lg:max-w-[60%] rounded-2xl px-4 py-2.5 ${
                    isOwn 
                        ? 'bg-gray-200 text-gray-500 rounded-tr-none' 
                        : 'bg-gray-100 text-gray-500 rounded-tl-none'
                }`}>
                    <p className="text-sm italic">{message.content || 'Message deleted'}</p>
                    <span className="text-xs opacity-75 mt-1 block">
                        {formatTime(message.createdAt)}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div 
            className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group relative`}
            onMouseEnter={() => {
                if (!isLocked && canEdit()) {
                    setShowActions(true);
                }
            }}
            onMouseLeave={() => {
                setShowActions(false);
            }}
        >
            {shouldShowTime() && (
                <div className="text-xs text-gray-400 mb-2 mt-4 mx-auto font-medium">
                    {formatFullDate(message.createdAt)}
                </div>
            )}
            
            <div className="relative">
                {/* Message Bubble */}
                <div className={`max-w-[75%] md:max-w-[70%] lg:max-w-[60%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    isOwn 
                        ? 'bg-gradient-to-br from-primary-500 to-accent-600 text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                    {isEditing ? (
                        <div className="space-y-2">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full p-2 border rounded-lg text-gray-800 bg-white text-sm"
                                rows="3"
                                autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={handleEdit}
                                    disabled={isEditingMsg}
                                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs flex items-center gap-1 transition-colors"
                                >
                                    {isEditingMsg ? (
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Check className="w-3 h-3" />
                                    )}
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditContent(message.content);
                                    }}
                                    className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs flex items-center gap-1 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm md:text-base break-words leading-relaxed whitespace-pre-wrap">
                                {message.content || ''}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                                <span className={`text-xs ${isOwn ? 'text-primary-200' : 'text-gray-400'}`}>
                                    {formatTime(message.createdAt)}
                                </span>
                                {message.isEdited && (
                                    <span className={`text-xs ${isOwn ? 'text-primary-200' : 'text-gray-400'}`}>
                                        (edited)
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Action Buttons */}
                {!isLocked && canEdit() && !isEditing && showActions && (
                    <div className={`absolute -top-10 flex gap-1 bg-white shadow-lg rounded-lg p-1 border border-gray-200 z-20 ${
                        isOwn ? 'right-0' : 'left-0'
                    }`}>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                            title="Edit message (within 5 minutes)"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="p-1.5 hover:bg-red-50 rounded text-red-600 transition-colors"
                            title="Delete message"
                        >
                            {isDeleting ? (
                                <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageBubble;