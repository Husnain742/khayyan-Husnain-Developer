import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FiActivity, FiBell, FiExternalLink, FiGrid, FiLogOut, FiMenu, FiSettings, FiUsers, FiX } from 'react-icons/fi';
import { useAuth } from '../lib/auth';

const NAV = [
  { to: '/admin/dashboard', label: 'Overview', icon: FiGrid },
  { to: '/admin/records', label: 'Marhoomein', icon: FiUsers },
  { to: '/admin/announcements', label: 'Khabarnama', icon: FiBell },
  { to: '/admin/settings', label: 'Settings', icon: FiSettings },
  { to: '/admin/activity', label: 'Activity Log', icon: FiActivity },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { email, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => { document.title = 'Admin | Khayyan Memorial Portal'; }, []);

  const handleLogout = () => { logout(); navigate('/admin', { replace: true }); };

  const sidebar = (
    <div className="h-full flex flex-col bg-plum-900 text-plum-100">
      <div className="px-5 pt-6 pb-5 flex items-center gap-3">
        <img src="/favicon.svg" alt="" className="w-10 h-10 rounded-xl" />
        <div>
          <p className="font-display font-bold text-white leading-tight">Khayyan</p>
          <p className="text-[11px] uppercase tracking-widest text-plum-200">Admin Panel</p>
        </div>
      </div>

      <nav className="px-3 mt-2 flex-1 space-y-1" aria-label="Admin">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${isActive ? 'bg-plum-700 text-white border border-white/10' : 'text-plum-100 hover:bg-white/5'}`}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-5 pt-4 border-t border-white/10 space-y-1">
        <Link to="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm text-plum-100 hover:bg-white/5"><FiExternalLink size={16} /> Website dekhein</Link>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm text-plum-100 hover:bg-white/5 cursor-pointer"><FiLogOut size={16} /> Logout</button>
        <p className="px-4 pt-2 text-[11px] text-plum-200/80 truncate" title={email}>{email}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream lg:pl-64">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-40">{sidebar}</aside>

      {/* mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-plum-900 text-white h-14 px-4 flex items-center justify-between">
        <span className="font-display font-bold">Admin Panel</span>
        <button onClick={() => setOpen(true)} aria-label="Menu kholein" className="w-10 h-10 flex items-center justify-center cursor-pointer"><FiMenu size={22} /></button>
      </div>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 max-w-[85%] pop">{sidebar}</div>
          <button className="flex-1 bg-plum-900/60" aria-label="Menu band karein" onClick={() => setOpen(false)}><FiX className="m-4 text-white ml-auto" size={22} /></button>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8"><Outlet /></main>
    </div>
  );
}
