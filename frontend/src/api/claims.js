import API from './axios';

// Submit a claim for a found or lost item
export const submitClaim = async (itemType, itemId, formData) => {
    const { data } = await API.post(`/claims/${itemType}/${itemId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
};

// Get all claims for an item (post owner view)
export const getClaimsForItem = async (itemType, itemId) => {
    const { data } = await API.get(`/claims/${itemType}/${itemId}`);
    return data;
};

// Get claims submitted by the current user
export const getMyClaims = async () => {
    const { data } = await API.get('/claims/mine');
    return data;
};

// Get claims received by the current user (on their own posts)
export const getReceivedClaims = async () => {
    const { data } = await API.get('/claims/received');
    return data;
};

// Get user's own found posts
export const getMyFoundPosts = async () => {
    const { data } = await API.get('/found/mine');
    return data;
};

// Get user's own lost posts
export const getMyLostPosts = async () => {
    const { data } = await API.get('/lost/mine');
    return data;
};

// Get a specific claim
export const getClaimById = async (id) => {
    const { data } = await API.get(`/claims/detail/${id}`);
    return data;
};

// Approve a claim (post owner)
export const approveClaim = async (id) => {
    const { data } = await API.post(`/claims/${id}/approve`);
    return data;
};

// Reject a claim (post owner)
export const rejectClaim = async (id, reason = '') => {
    const { data } = await API.post(`/claims/${id}/reject`, { reason });
    return data;
};

// Confirm return or retrieval
export const confirmReturn = async (id) => {
    const { data } = await API.post(`/claims/${id}/confirm-return`);
    return data;
};

// Get all my chats
export const getMyChats = async () => {
    const { data } = await API.get('/chats');
    return data;
};

// Get a single chat by ID
export const getChatById = async (id) => {
    const { data } = await API.get(`/chats/${id}`);
    return data;
};

// Get messages for a chat
export const getMessages = async (chatId, page = 1) => {
    const { data } = await API.get(`/messages/${chatId}?page=${page}`);
    return data;
};

// Send a message
export const sendMessage = async (chatId, content) => {
    const { data } = await API.post('/messages', { chatId, content });
    return data;
};

// Edit a message
export const editMessage = async (id, content) => {
    const { data } = await API.put(`/messages/${id}/edit`, { content });
    return data;
};

// Delete a message
export const deleteMessage = async (id) => {
    const { data } = await API.delete(`/messages/${id}`);
    return data;
};
