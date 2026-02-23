import { createContext, useEffect, useState, useCallback } from 'react';
import api, { setAccessToken, getAccessToken } from '@/api/axios';

export const AuthContext = createContext(null);

const USER_KEY = 'user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
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
      localStorage.setItem(USER_KEY, JSON.stringify(data));
    } catch {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem(USER_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      if (getAccessToken()) {
        await fetchUser();
        return;
      }
      try {
        const { data } = await api.post('/auth/refresh-token');
        if (data.token) {
          setAccessToken(data.token);
          await fetchUser();
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    }
    init();
  }, [fetchUser]);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth-logout', onLogout);
    return () => window.removeEventListener('auth-logout', onLogout);
  }, []);

  const login = useCallback((token, userData) => {
    setAccessToken(token);
    setUser(userData);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem(USER_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}
