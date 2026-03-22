import { useState } from 'react';
import ChatWindow from '../components/Chat/ChatWindow.';

const TestMessaging = () => {
    const [testChatId] = useState('YOUR_TEST_CHAT_ID');
    const currentUserId = 'YOUR_USER_ID'; // Get from auth context

    return (
        <div className="container mx-auto p-4 h-screen">
            <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
                <div className="p-4 border-b">
                    <h1 className="text-xl font-bold">Test Messaging Features</h1>
                    <p className="text-sm text-gray-500">Test edit and delete functionality</p>
                </div>
                
                <div className="flex-1">
                    <ChatWindow 
                        chatId={testChatId} 
                        currentUserId={currentUserId}
                    />
                </div>
            </div>
        </div>
    );
};

export default TestMessaging;