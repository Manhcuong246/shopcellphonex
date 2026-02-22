import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { setAccessToken } from '@/api/axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    } catch {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const tryRefreshThenFetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/refresh-token');
      if (data.token) {
        setAccessToken(data.token);
        await fetchUser();
      } else {
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('user');
        setLoading(false);
      }
    } catch {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('user');
      setLoading(false);
    }
  }, [fetchUser]);

  useEffect(() => {
    tryRefreshThenFetchUser();
  }, []);

  useEffect(() => {
    window.__onAccessTokenRefreshed = (token) => {
      setAccessToken(token);
    };
    return () => { delete window.__onAccessTokenRefreshed; };
  }, []);

  useEffect(() => {
    const onLogout = () => {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('user');
    };
    window.addEventListener('auth-logout', onLogout);
    return () => window.removeEventListener('auth-logout', onLogout);
  }, []);

  const login = useCallback((token, userData) => {
    setAccessToken(token);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}
