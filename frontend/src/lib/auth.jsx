import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, TOKEN_KEY } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState(() => (sessionStorage.getItem(TOKEN_KEY) ? 'loading' : 'anon'));
  const [email, setEmail] = useState('');

  // Verify any existing token with the server (never trust a flag stored in the browser).
  useEffect(() => {
    if (status !== 'loading') return;
    let cancelled = false;
    api.get('/auth/me')
      .then((res) => { if (!cancelled) { setEmail(res.data.email); setStatus('authed'); } })
      .catch(() => { if (!cancelled) { sessionStorage.removeItem(TOKEN_KEY); setStatus('anon'); } });
    return () => { cancelled = true; };
  }, [status]);

  useEffect(() => {
    const onLogout = () => { setEmail(''); setStatus('anon'); };
    window.addEventListener('khayyan:logout', onLogout);
    return () => window.removeEventListener('khayyan:logout', onLogout);
  }, []);

  const login = useCallback(async (emailInput, password) => {
    const res = await api.post('/auth/login', { email: emailInput, password });
    sessionStorage.setItem(TOKEN_KEY, res.data.token);
    setEmail(res.data.email);
    setStatus('authed');
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setEmail('');
    setStatus('anon');
  }, []);

  const value = useMemo(() => ({ status, email, login, logout }), [status, email, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
