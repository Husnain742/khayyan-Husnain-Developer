import { Link } from 'react-router-dom';
import { usePageTitle } from '../lib/hooks';

export default function NotFound() {
  usePageTitle('Page nahi mila');
  return (
    <div className="max-w-lg mx-auto text-center px-6 py-24">
      <p className="font-display text-7xl font-extrabold text-plum-200">404</p>
      <h1 className="text-3xl font-bold mt-2">Ye page nahi mila</h1>
      <p className="text-muted mt-2">Link shayad ghalat hai ya page hata diya gaya hai.</p>
      <Link to="/" className="btn btn-primary mt-6">Home par wapas</Link>
    </div>
  );
}
