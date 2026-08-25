import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import { clearSession, getStoredUser, setUnauthorizedHandler, storeSession } from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  // Start from localStorage so a reload does not flash the signed-out UI.
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  // The API layer calls this when the server rejects our token.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  // Revalidate the cached session against the server on boot: the token may
  // have expired, or the profile may have changed on another device.
  useEffect(() => {
    let cancelled = false;

    const revalidate = async () => {
      if (!getStoredUser()) {
        setLoading(false);
        return;
      }

      try {
        const profile = await authService.getProfile();
        if (cancelled) return;
        storeSession(profile);
        setUser((current) => ({ ...current, ...profile }));
      } catch (error) {
        // 401 already cleared the session via the interceptor. Any other
        // failure (server down, offline) should not sign the user out.
        if (cancelled) return;
        if (error?.response?.status === 401) {
          clearSession();
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    revalidate();

    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback(async (formData) => {
    const data = await authService.register(formData);
    setUser(data);
    return data;
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data);
    return data;
  }, []);

  const updateProfile = useCallback(async (userData) => {
    const data = await authService.updateProfile(userData);
    setUser(data);
    return data;
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: Boolean(user), register, login, logout, updateProfile }),
    [user, loading, register, login, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
