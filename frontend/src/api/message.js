import API from './axios';

// Send a message
export const sendMessage = async (data) => {
    const response = await API.post('/messages', data);
    return response.data.data;
};

// Get messages for a chat
export const getMessages = async (chatId) => {
    const response = await API.get(`/messages/${chatId}`);
    return response.data.data;
};

// Edit a message
export const editMessage = async (messageId, content) => {
    const response = await API.put(`/messages/${messageId}/edit`, { content });
    return response.data;
};

// Delete a message
export const deleteMessage = async (messageId) => {
    const response = await API.delete(`/messages/${messageId}/delete`);
    return response.data;
};