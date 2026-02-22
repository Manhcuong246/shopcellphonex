import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // gửi httpOnly cookie (refresh_token) khi gọi API
});

const tokenRef = { current: null };

export function setAccessToken(token) {
  tokenRef.current = token;
}

api.interceptors.request.use((config) => {
  if (tokenRef.current) config.headers.Authorization = `Bearer ${tokenRef.current}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(err, token = null) {
  failedQueue.forEach((prom) => (token ? prom.resolve(token) : prom.reject(err)));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((e) => Promise.reject(e));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await api.post('/auth/refresh-token');
      const newToken = data.token;
      setAccessToken(newToken);
      processQueue(null, newToken);
      if (typeof window !== 'undefined' && window.__onAccessTokenRefreshed) {
        window.__onAccessTokenRefreshed(newToken);
      }
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      setAccessToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-logout'));
      }
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
