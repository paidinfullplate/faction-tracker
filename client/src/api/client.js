import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('faction_auth');
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // ignore
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('faction_auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
