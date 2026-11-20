import { useCallback, useEffect, useState } from 'react';
import { FiActivity } from 'react-icons/fi';
import { api, errMsg } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { usePageTitle } from '../../lib/hooks';
import { EmptyState, ErrorState, Skeleton } from '../../components/States';

const LABEL = { login: 'Login', login_failed: 'Login nakaam', create: 'Naya', update: 'Tabdeeli', delete: 'Delete', export: 'Export', settings: 'Settings' };
const BADGE = { login: 'badge-ok', login_failed: 'badge-bad', create: 'badge-ok', update: 'badge-warn', delete: 'badge-bad', export: 'badge-plum', settings: 'badge-plum' };

export default function Activity() {
  usePageTitle('Activity | Admin');
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError(''); setItems(null);
    try { setItems((await api.get('/admin/audit', { params: { limit: 100 } })).data.data); }
    catch (err) { setError(errMsg(err)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <header className="card p-6">
        <h1 className="text-3xl font-extrabold text-plum-900">Activity Log</h1>
        <p className="text-muted mt-1">Admin ke login aur har tabdeeli ka record (pichle 180 din). Nakaam login ki koshishein bhi yahan nazar aati hain.</p>
      </header>

      {error ? <ErrorState message={error} onRetry={load} /> : items === null ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : items.length === 0 ? <EmptyState icon={FiActivity} title="Abhi koi sargarmi nahi" /> : (
        <ul className="card card-white divide-y divide-line overflow-hidden">
          {items.map((a) => (
            <li key={a._id} className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className={`badge ${BADGE[a.action] || 'badge-plum'} w-24 justify-center`}>{LABEL[a.action] || a.action}</span>
              <p className="flex-1 min-w-[12rem] text-sm font-medium">{a.summary}</p>
              <span className="text-xs text-muted font-mono">{a.ip}</span>
              <span className="text-xs text-muted w-28 text-right">{formatDateTime(a.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
