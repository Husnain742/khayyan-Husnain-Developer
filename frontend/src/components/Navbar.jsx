import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FiLock, FiMenu, FiX } from 'react-icons/fi';

const linkCls = ({ isActive }) =>
  `px-3 py-2 rounded-full text-sm font-semibold transition-colors ${isActive ? 'bg-plum-100 text-plum-700' : 'text-plum-800 hover:bg-plum-50'}`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur border-b border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img src="/favicon.svg" alt="" className="w-9 h-9 rounded-xl" />
          <span className="font-display text-xl font-bold text-plum-800">Khayyan <span className="text-plum-500">Memorial</span></span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1" aria-label="Main">
          <NavLink to="/" end className={linkCls}>Home</NavLink>
          <NavLink to="/directory" className={linkCls}>Directory</NavLink>
          <Link to="/admin" className="ml-2 btn btn-ghost btn-sm"><FiLock size={14} /> Admin</Link>
        </nav>

        <button className="sm:hidden w-10 h-10 rounded-full border border-line bg-white flex items-center justify-center cursor-pointer" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {open && (
        <nav className="sm:hidden border-t border-line bg-cream px-4 py-3 flex flex-col gap-1 pop" aria-label="Mobile">
          <NavLink to="/" end className={linkCls} onClick={() => setOpen(false)}>Home</NavLink>
          <NavLink to="/directory" className={linkCls} onClick={() => setOpen(false)}>Directory</NavLink>
          <NavLink to="/admin" className={linkCls} onClick={() => setOpen(false)}>Admin Portal</NavLink>
        </nav>
      )}
    </header>
  );
}
