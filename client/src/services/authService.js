import api, { clearSession, storeSession } from '../api/client';

const register = async (userData) => {
  const { data } = await api.post('/users', userData);
  storeSession(data);
  return data;
};

const login = async (email, password) => {
  const { data } = await api.post('/users/login', { email, password });
  storeSession(data);
  return data;
};

const logout = () => {
  clearSession();
};

const getProfile = async () => {
  const { data } = await api.get('/users/profile');
  return data;
};

const updateProfile = async (userData) => {
  const { data } = await api.put('/users/profile', userData);
  storeSession(data);
  return data;
};

const getPublicProfile = async (userId) => {
  const { data } = await api.get(`/users/${userId}`);
  return data;
};

const authService = { register, login, logout, getProfile, updateProfile, getPublicProfile };

export default authService;
