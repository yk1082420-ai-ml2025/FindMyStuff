import API from './axios';

// Get messages for a specific chat 
// (If GET /chats/:id already returns messages, we might not need a separate GET /messages/:chatId endpoint, 
// but the plan says GET /chats/:id gets chat with messages. We'll use getChat from chat.js for that, or if there's paginated GET /messages)
// Assuming we send message using POST /messages
export const sendMessage = async (messageData) => {
  const { data } = await API.post('/messages', messageData);
  return data.data || data;
};

// Mark messages in a chat as read
export const markMessagesAsRead = async (chatId) => {
  const { data } = await API.put(`/messages/mark-read/${chatId}`);
  return data.data || data;
};
