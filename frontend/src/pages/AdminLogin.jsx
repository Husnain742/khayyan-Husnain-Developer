import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiShield } from 'react-icons/fi';
import { useAuth } from '../lib/auth';
import { errMsg } from '../lib/api';
import { usePageTitle } from '../lib/hooks';

export default function AdminLogin() {
  usePageTitle('Admin Login');
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (status === 'authed') return <Navigate to="/admin/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
      const target = location.state?.from?.startsWith('/admin') ? location.state.from : '/admin/dashboard';
      navigate(target, { replace: true });
    } catch (err) {
      setError(errMsg(err, 'Login nahi ho saka.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-plum-900 text-plum-100 p-12 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-plum-700/40" aria-hidden="true" />
        <div className="absolute -left-16 bottom-0 w-72 h-72 rounded-full bg-plum-800" aria-hidden="true" />
        <Link to="/" className="relative flex items-center gap-3"><img src="/favicon.svg" alt="" className="w-11 h-11 rounded-xl" /><span className="font-display text-2xl font-bold text-white">Khayyan Memorial</span></Link>
        <div className="relative">
          <FiShield size={36} className="text-gold mb-4" />
          <h2 className="font-display text-4xl font-bold text-white leading-tight">Sirf intezamia ke liye mehfooz portal</h2>
          <p className="mt-3 text-plum-200 max-w-md">Records, khabarnama aur portal settings yahan se control hoti hain. Har tabdeeli ka record rakha jata hai.</p>
        </div>
        <p className="relative text-xs text-plum-200">© {new Date().getFullYear()} Khayyan Memorial Portal</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-3"><img src="/favicon.svg" alt="" className="w-10 h-10 rounded-xl" /><span className="font-display text-xl font-bold text-plum-800">Khayyan Memorial</span></Link>
          </div>
          <div className="card card-white p-7 sm:p-9">
            <span className="badge badge-plum"><FiLock size={12} /> Verified Admin Portal</span>
            <h1 className="text-3xl font-bold mt-3">Admin Login</h1>
            <p className="text-sm text-muted mt-1">Apni email aur password se andar dakhil hon.</p>

            {error && <div role="alert" className="mt-5 rounded-xl bg-bad-soft border border-[#f6c9d1] text-bad text-sm font-medium px-4 py-3">{error}</div>}

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input id="email" type="email" required autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="admin@example.com" />
              </div>
              <div>
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <input id="password" type={show ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input pr-12" placeholder="••••••••••••" />
                  <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Password chupayein' : 'Password dikhayein'} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer">
                    {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={busy} className="btn btn-primary w-full !py-3">
                {busy ? 'Check ho raha hai...' : <>Login karein <FiArrowRight size={16} /></>}
              </button>
            </form>
          </div>
          <p className="text-center text-xs text-muted mt-5"><Link to="/" className="hover:text-plum-600 font-semibold">← Website par wapas</Link></p>
        </div>
      </div>
    </div>
  );
}
