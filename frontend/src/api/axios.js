import axios from 'axios';

const TOKEN_KEY = 'token';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response?.status !== 401) return Promise.reject(err);
    if (originalRequest._retry) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-logout'));
      return Promise.reject(err);
    }
    originalRequest._retry = true;
    try {
      const { data } = await api.post('/auth/refresh-token');
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      }
    } catch (_) {}
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-logout'));
    return Promise.reject(err);
  }
);

export function setAccessToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export default api;
