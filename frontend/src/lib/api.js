import axios from 'axios';

const base = (import.meta.env.VITE_API_URL || 'https://khayyan-portal-backend.vercel.app').replace(/\/$/, '');

export const TOKEN_KEY = 'khayyan_admin_token';

export const api = axios.create({ baseURL: `${base}/api`, timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the server says our admin session is invalid, drop it and let the UI send us to the login page.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.includes('/auth/login')) {
      sessionStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('khayyan:logout'));
    }
    return Promise.reject(err);
  },
);

export function errMsg(err, fallback = 'Kuch masla aaya hai. Dobara try karein.') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ERR_NETWORK') return 'Internet ya server se rabta nahi ho saka.';
  if (err?.code === 'ECONNABORTED') return 'Server ne jawab dene mein bohat der lagayi.';
  return fallback;
}
