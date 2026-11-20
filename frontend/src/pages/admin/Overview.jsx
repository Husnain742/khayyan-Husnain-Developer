import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiBell, FiCheckCircle, FiClock, FiImage, FiPlus, FiShield, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { api, errMsg } from '../../lib/api';
import { formatDate, formatDateTime, timeLeft } from '../../lib/format';
import { ErrorState, Skeleton } from '../../components/States';
import { Donut, LineChart } from '../../components/charts';
import Avatar from '../../components/Avatar';

const ACTION_LABEL = { login: 'Login', login_failed: 'Login nakaam', create: 'Naya', update: 'Tabdeeli', delete: 'Delete', export: 'Export', settings: 'Settings' };
const ACTION_BADGE = { login: 'badge-ok', login_failed: 'badge-bad', create: 'badge-ok', update: 'badge-warn', delete: 'badge-bad', export: 'badge-plum', settings: 'badge-plum' };

function Stat({ icon: Icon, label, value, hint, tone = 'plum' }) {
  const tones = { plum: 'bg-plum-100 text-plum-600', gold: 'bg-gold-soft text-gold', warn: 'bg-warn-soft text-warn', ok: 'bg-ok-soft text-ok' };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${tones[tone]}`}><Icon size={17} /></span>
      </div>
      <p className="font-display text-4xl font-extrabold text-plum-800 mt-3 leading-none">{value}</p>
      {hint && <p className="text-xs text-muted font-medium mt-2">{hint}</p>}
    </div>
  );
}

export default function Overview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError(''); setData(null);
    try { setData((await api.get('/admin/overview')).data.data); }
    catch (err) { setError(errMsg(err)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const soon = data ? data.announcements.filter((a) => new Date(a.expiresAt).getTime() - Date.now() < 6 * 3600 * 1000) : [];

  return (
    <div className="space-y-6">
      <header className="card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <span className="badge badge-plum"><FiShield size={12} /> Verified Admin Portal</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-3 text-plum-900">Dashboard Overview</h1>
          <p className="text-muted mt-1">Records, khabarnama aur portal ki sargarmi ek nazar mein.</p>
        </div>
        <Link to="/admin/records?new=1" className="btn btn-primary !py-3 !px-6 self-start"><FiPlus size={16} /> Naya Record</Link>
      </header>

      {error ? <ErrorState message={error} onRetry={load} /> : !data ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>
          <Skeleton className="h-72" />
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {data.totals.noPhoto > 0 ? (
              <div className="rounded-2xl border border-[#f3dfa3] bg-warn-soft p-4 flex items-center gap-4">
                <span className="w-12 h-12 rounded-xl bg-[#fbe6a5] text-warn flex items-center justify-center shrink-0"><FiAlertTriangle size={20} /></span>
                <div className="flex-1 min-w-0"><p className="font-bold text-warn">Tasveer baqi hai</p><p className="text-sm text-warn/90">{data.totals.noPhoto} record(s) mein photo nahi hai.</p></div>
                <Link to="/admin/records?noPhoto=1" className="btn btn-sm bg-[#fbe6a5] text-warn hover:bg-[#f8dc86]">Dekhein</Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#c4e6d4] bg-ok-soft p-4 flex items-center gap-4">
                <span className="w-12 h-12 rounded-xl bg-[#cdeedd] text-ok flex items-center justify-center shrink-0"><FiCheckCircle size={20} /></span>
                <div><p className="font-bold text-ok">Records mukammal hain</p><p className="text-sm text-ok/90">Har record mein tasveer mojood hai.</p></div>
              </div>
            )}
            {soon.length > 0 ? (
              <div className="rounded-2xl border border-[#f3dfa3] bg-warn-soft p-4 flex items-center gap-4">
                <span className="w-12 h-12 rounded-xl bg-[#fbe6a5] text-warn flex items-center justify-center shrink-0"><FiClock size={20} /></span>
                <div className="flex-1 min-w-0"><p className="font-bold text-warn">Elaan jald expire honge</p><p className="text-sm text-warn/90">{soon.length} khabarnama 6 ghante mein hat jayega.</p></div>
                <Link to="/admin/announcements" className="btn btn-sm bg-[#fbe6a5] text-warn hover:bg-[#f8dc86]">Dekhein</Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#c4e6d4] bg-ok-soft p-4 flex items-center gap-4">
                <span className="w-12 h-12 rounded-xl bg-[#cdeedd] text-ok flex items-center justify-center shrink-0"><FiBell size={20} /></span>
                <div className="flex-1"><p className="font-bold text-ok">Khabarnama theek hai</p><p className="text-sm text-ok/90">{data.totals.announcements} elaan abhi live hain.</p></div>
                <Link to="/admin/announcements" className="btn btn-sm bg-[#cdeedd] text-ok hover:bg-[#bfe8d3]">Manage</Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat icon={FiUsers} label="Total Records" value={data.totals.records} />
            <Stat icon={FiTrendingUp} label="Pichle 30 din" value={`+${data.totals.added30}`} hint="Naye shamil hue" tone="gold" />
            <Stat icon={FiBell} label="Live Elaanat" value={data.totals.announcements} tone="ok" />
            <Stat icon={FiImage} label="Bina Tasveer" value={data.totals.noPhoto} tone="warn" />
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            <section className="card p-6 lg:col-span-3">
              <h2 className="text-xl font-bold mb-4">Saal ba saal wafat ke records</h2>
              <LineChart data={data.byYear} />
            </section>
            <section className="card p-6 lg:col-span-2">
              <h2 className="text-xl font-bold mb-4">Wand ke hisaab se</h2>
              <Donut data={data.byWand} />
            </section>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <section className="card p-6">
              <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold">Haal hi mein shamil</h2><Link to="/admin/records" className="text-sm font-semibold text-plum-600 hover:underline">Sab dekhein</Link></div>
              {data.recent.length === 0 ? <p className="text-sm text-muted py-6 text-center">Abhi koi record nahi.</p> : (
                <ul className="divide-y divide-line">
                  {data.recent.map((r) => (
                    <li key={r._id} className="py-3 flex items-center gap-3">
                      <Avatar src={r.imageName} name={r.name} className="w-11 h-11" />
                      <div className="min-w-0 flex-1"><p className="font-semibold truncate">{r.name}</p><p className="text-xs text-muted truncate">s/o {r.fatherName} · {r.wand}</p></div>
                      <span className="text-xs text-muted font-medium shrink-0">{formatDate(r.dateOfDemise)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card p-6">
              <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold">Taaza sargarmi</h2><Link to="/admin/activity" className="text-sm font-semibold text-plum-600 hover:underline">Poora log</Link></div>
              {data.activity.length === 0 ? <p className="text-sm text-muted py-6 text-center">Abhi koi sargarmi nahi.</p> : (
                <ul className="divide-y divide-line">
                  {data.activity.map((a) => (
                    <li key={a._id} className="py-3 flex items-center gap-3">
                      <span className={`badge ${ACTION_BADGE[a.action] || 'badge-plum'} shrink-0`}>{ACTION_LABEL[a.action] || a.action}</span>
                      <p className="text-sm flex-1 min-w-0 truncate">{a.summary}</p>
                      <span className="text-xs text-muted shrink-0">{formatDateTime(a.at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {data.announcements.length > 0 && (
            <section className="card p-6">
              <h2 className="text-xl font-bold mb-3">Live khabarnama</h2>
              <ul className="divide-y divide-line">
                {data.announcements.slice(0, 5).map((a) => (
                  <li key={a._id} className="py-3 flex items-center gap-3">
                    <span className="badge badge-plum shrink-0">{a.type}</span>
                    <p className="flex-1 min-w-0 truncate font-medium">{a.title}</p>
                    <span className="text-xs text-muted shrink-0">{timeLeft(a.expiresAt)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
