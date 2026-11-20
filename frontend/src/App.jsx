import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { FeedbackProvider } from './components/Feedback';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { Spinner } from './components/States';
import PublicLayout from './layouts/PublicLayout';
import Home from './pages/Home';
import Directory from './pages/Directory';
import NotFound from './pages/NotFound';
import AdminLogin from './pages/AdminLogin';

// Admin screens are only downloaded when needed.
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const Overview = lazy(() => import('./pages/admin/Overview'));
const Records = lazy(() => import('./pages/admin/Records'));
const Announcements = lazy(() => import('./pages/admin/Announcements'));
const SettingsPage = lazy(() => import('./pages/admin/Settings'));
const Activity = lazy(() => import('./pages/admin/Activity'));

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <FeedbackProvider>
          <AuthProvider>
            <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center"><Spinner /></div>}>
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/directory" element={<Directory />} />
                </Route>

                <Route path="/admin" element={<AdminLogin />} />
                <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                  <Route path="/admin/dashboard" element={<Overview />} />
                  <Route path="/admin/records" element={<Records />} />
                  <Route path="/admin/announcements" element={<Announcements />} />
                  <Route path="/admin/settings" element={<SettingsPage />} />
                  <Route path="/admin/activity" element={<Activity />} />
                </Route>

                <Route element={<PublicLayout />}>
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </AuthProvider>
        </FeedbackProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
