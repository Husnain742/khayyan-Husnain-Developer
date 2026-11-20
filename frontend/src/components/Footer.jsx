import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-20 bg-plum-900 text-plum-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
        <div>
          <p className="font-display text-xl font-bold text-white">Khayyan Memorial Portal</p>
          <p className="text-sm text-plum-200 mt-1">Gaoon Khayyan ke marhoomein ka digital record.</p>
        </div>
        <nav className="flex gap-5 text-sm font-semibold" aria-label="Footer">
          <Link to="/" className="hover:text-white">Home</Link>
          <Link to="/directory" className="hover:text-white">Directory</Link>
          <Link to="/admin" className="hover:text-white">Admin</Link>
        </nav>
      </div>
      <div className="border-t border-white/10 text-center text-xs text-plum-200 py-4">
        © {new Date().getFullYear()} Khayyan Memorial Portal · Allah sab marhoomein ki maghfirat farmaye. Ameen.
      </div>
    </footer>
  );
}
