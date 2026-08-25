import axios from 'axios';

/**
 * One axios instance for the whole app.
 *
 * The base URL is relative, which is what makes the single-service deployment
 * work: in development CRA proxies /api to localhost:5000, and in production
 * Express serves the built client from the same origin as the API.
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

export const TOKEN_KEY = 'tb_token';
export const USER_KEY = 'tb_user';

export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    // Private browsing modes can throw on access.
    return null;
  }
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const storeSession = (user) => {
  try {
    const { token, ...profile } = user;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
  } catch {
    /* storage unavailable — the session simply will not survive a reload */
  }
};

export const clearSession = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* nothing to clear */
  }
};

// Attach the token per request rather than setting a global default, so a
// logout in one tab cannot leave a stale header behind.
api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let onUnauthorized = null;

/** Lets AuthContext react to an expired or revoked token. */
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A rejected token means the stored session is dead; drop it so the UI
    // stops pretending the user is signed in.
    if (error.response?.status === 401 && getStoredToken()) {
      clearSession();
      onUnauthorized?.();
    }

    return Promise.reject(error);
  }
);

/**
 * Turns any axios failure into a message worth showing a person.
 *
 * @param {unknown} error
 * @param {string} fallback
 * @returns {string}
 */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (error?.request && !error.response) return 'Cannot reach the server. Check your connection.';
  return error?.message || fallback;
};

export default api;
