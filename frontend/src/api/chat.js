import API from './axios';

// Get all chats for the current user
export const getUserChats = async () => {
  const { data } = await API.get('/chats');
  return data.data; // backend returns { success: true, data: [...] }
};

// Create a new chat or get existing one with a user or related to an item
// The backend might expect a userId or itemId. Based on the requirements, POST /chats creates a chat.
export const createChat = async (chatData) => {
  const { data } = await API.post('/chats', chatData);
  return data.data;
};

// Get a specific chat (often includes messages or we use a separate message endpoint)
export const getChat = async (chatId) => {
  const { data } = await API.get(`/chats/${chatId}`);
  return data.data; // returns { chat: {...}, messages: [...] }
};
