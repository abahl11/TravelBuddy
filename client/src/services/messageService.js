import api from '../api/client';

const sendMessage = async (messageData) => {
  const { data } = await api.post('/messages', messageData);
  return data;
};

const getConversations = async () => {
  const { data } = await api.get('/messages');
  return data;
};

const getUnreadCount = async () => {
  const { data } = await api.get('/messages/unread-count');
  return data.count;
};

const getMessagesByUser = async (userId) => {
  const { data } = await api.get(`/messages/${userId}`);
  return data;
};

const markMessageAsRead = async (messageId) => {
  const { data } = await api.put(`/messages/${messageId}/read`);
  return data;
};

const messageService = {
  sendMessage,
  getConversations,
  getUnreadCount,
  getMessagesByUser,
  markMessageAsRead,
};

export default messageService;
