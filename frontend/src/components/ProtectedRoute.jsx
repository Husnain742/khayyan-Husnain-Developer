import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Spinner } from './States';

/** UI guard only. The real protection is the server-side admin check on every admin API. */
export default function ProtectedRoute({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <div className="min-h-screen bg-cream flex items-center justify-center"><Spinner label="Check ho raha hai..." /></div>;
  if (status !== 'authed') return <Navigate to="/admin" replace state={{ from: location.pathname }} />;
  return children;
}
