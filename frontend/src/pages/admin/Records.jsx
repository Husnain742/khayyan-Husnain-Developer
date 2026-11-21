import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiDownload, FiEdit2, FiPlus, FiSearch, FiTrash2, FiUsers } from 'react-icons/fi';
import { api, errMsg } from '../../lib/api';
import { WANDS } from '../../lib/constants';
import { dayLabel, formatDate } from '../../lib/format';
import { useDebounce, usePageTitle } from '../../lib/hooks';
import { useFeedback } from '../../components/Feedback';
import Avatar from '../../components/Avatar';
import { EmptyState, ErrorState, Skeleton } from '../../components/States';
import RecordForm from './RecordForm';

const LIMIT = 15;

export default function Records() {
  usePageTitle('Marhoomein | Admin');
  const { toast, confirm } = useFeedback();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [wand, setWand] = useState('All');
  const [sort, setSort] = useState('newest');
  const [noPhoto, setNoPhoto] = useState(params.get('noPhoto') === '1');
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounce(q);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(params.get('new') === '1' ? { record: null } : null);
  const [exporting, setExporting] = useState(false);
  const reqId = useRef(0);

  // new filter => back to page 1
  useEffect(() => { setPage(1); }, [debouncedQ, wand, sort, noPhoto]);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true); setError('');
    try {
      const res = await api.get('/marhoomein', { params: { q: debouncedQ || undefined, wand, sort, noPhoto: noPhoto ? 'true' : undefined, page, limit: LIMIT } });
      if (id !== reqId.current) return;
      setRows(res.data.data); setTotal(res.data.total); setPages(res.data.pages);
    } catch (err) {
      if (id === reqId.current) setError(errMsg(err));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [debouncedQ, wand, sort, noPhoto, page]);
  useEffect(() => { load(); }, [load]);

  // clean the one-shot ?new=1 / ?noPhoto=1 params so a refresh doesn't re-trigger them
  useEffect(() => {
    if (params.get('new') || params.get('noPhoto')) setParams({}, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (r) => {
    const ok = await confirm({
      title: 'Record delete karein?',
      message: `"${r.name}" ka record aur us ki tasveer hamesha ke liye hat jayegi. Ye amal wapas nahi ho sakta.`,
      confirmText: 'Haan, delete karein', danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/marhoomein/${r._id}`);
      toast.success('Record delete ho gaya.');
      if (rows.length === 1 && page > 1) setPage(page - 1); else load();
    } catch (err) { toast.error(errMsg(err)); }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get('/admin/export.csv', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `khayyan-records-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success('Backup download ho gaya.');
    } catch (err) { toast.error(errMsg(err, 'Export nahi ho saka.')); }
    finally { setExporting(false); }
  };

  return (
    <div className="space-y-6">
      <header className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-plum-900">Marhoomein ke Records</h1>
          <p className="text-muted mt-1">Shamil karein, tabdeel karein ya hata dein. Kul {total} record.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-ghost" onClick={exportCsv} disabled={exporting}><FiDownload size={16} /> {exporting ? 'Export...' : 'CSV Backup'}</button>
          <button className="btn btn-primary" onClick={() => setForm({ record: null })}><FiPlus size={16} /> Naya Record</button>
        </div>
      </header>

      <div className="card p-4 grid md:grid-cols-[1fr_auto_auto] gap-3 items-center">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-plum-400" size={17} aria-hidden="true" />
          <input type="search" className="input !pl-11" placeholder="Naam ya waldiyat se talash..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Talash" />
        </div>
        <select className="input md:!w-48" value={wand} onChange={(e) => setWand(e.target.value)} aria-label="Wand">
          <option value="All">Poora Gaoon</option>{WANDS.map((w) => <option key={w}>{w}</option>)}
        </select>
        <select className="input md:!w-48" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Tarteeb">
          <option value="newest">Naye shamil pehle</option><option value="demise">Tareekh-e-wafat</option><option value="name">Naam (A–Z)</option>
        </select>
        <label className="md:col-span-3 inline-flex items-center gap-2 text-sm font-semibold text-plum-800 cursor-pointer w-max">
          <input type="checkbox" checked={noPhoto} onChange={(e) => setNoPhoto(e.target.checked)} /> Sirf wo records jin mein tasveer nahi
        </label>
      </div>

      {error ? <ErrorState message={error} onRetry={load} /> : loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={FiUsers} title="Koi record nahi mila" text="Filter badal kar dekhein ya naya record shamil karein."
          action={<button className="btn btn-primary" onClick={() => setForm({ record: null })}><FiPlus size={16} /> Naya Record</button>} />
      ) : (
        <>
          <ul className="card card-white divide-y divide-line overflow-hidden">
            {rows.map((r) => (
              <li key={r._id} className="p-4 flex items-center gap-4 hover:bg-plum-50/60 transition-colors">
                <Avatar src={r.imageName} name={r.name} className="w-14 h-14" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate">{r.name}</p>
                  <p className="text-sm text-muted truncate">Waldiyat: {r.fatherName}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 md:hidden">
                    <span className="badge badge-plum">{(r.wand || '').replace(' Wand', '')}</span>
                    <span className="text-xs text-muted">{formatDate(r.dateOfDemise)}</span>
                  </div>
                </div>
                <span className="badge badge-plum hidden md:inline-flex">{r.wand}</span>
                <div className="hidden md:block text-right w-36">
                  <p className="text-sm font-semibold">{formatDate(r.dateOfDemise)}</p>
                  <p className="text-xs text-muted">{dayLabel(r.dayOfWeek)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="btn btn-ghost btn-sm !px-3" onClick={() => setForm({ record: r })} aria-label={`${r.name} edit karein`}><FiEdit2 size={15} /></button>
                  <button className="btn btn-danger btn-sm !px-3" onClick={() => remove(r)} aria-label={`${r.name} delete karein`}><FiTrash2 size={15} /></button>
                </div>
              </li>
            ))}
          </ul>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><FiChevronLeft size={16} /> Pichla</button>
              <span className="text-sm font-semibold text-muted">Page {page} / {pages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Agla <FiChevronRight size={16} /></button>
            </div>
          )}
        </>
      )}

      {form && <RecordForm record={form.record} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
    </div>
  );
}
