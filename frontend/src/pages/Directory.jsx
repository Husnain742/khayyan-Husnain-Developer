import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiCalendar, FiSearch, FiUsers, FiX } from 'react-icons/fi';
import { api, errMsg } from '../lib/api';
import { WANDS } from '../lib/constants';
import { dayLabel, formatDate } from '../lib/format';
import { useDebounce, usePageTitle } from '../lib/hooks';
import Avatar from '../components/Avatar';
import RecordModal from '../components/RecordModal';
import { EmptyState, ErrorState, Skeleton } from '../components/States';

const PAGE_SIZE = 24;

export default function Directory() {
  usePageTitle('Marhoomein Directory');
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('search') || '');
  const [wand, setWand] = useState(WANDS.includes(params.get('wand')) ? params.get('wand') : 'All');
  const [sort, setSort] = useState('newest');
  const debouncedQ = useDebounce(q);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const reqId = useRef(0);

  const fetchPage = useCallback(async (pageNum, append) => {
    const id = ++reqId.current;
    if (append) setLoadingMore(true); else { setLoading(true); setError(''); }
    try {
      const res = await api.get('/marhoomein', { params: { q: debouncedQ || undefined, wand, sort, page: pageNum, limit: PAGE_SIZE } });
      if (id !== reqId.current) return; // a newer request replaced this one
      const { data, pages: p, total: t } = res.data;
      setItems((prev) => (append ? [...prev, ...data] : data));
      setPage(pageNum); setPages(p); setTotal(t);
    } catch (err) {
      if (id === reqId.current) setError(errMsg(err));
    } finally {
      if (id === reqId.current) { setLoading(false); setLoadingMore(false); }
    }
  }, [debouncedQ, wand, sort]);

  useEffect(() => { fetchPage(1, false); }, [fetchPage]);

  // pick up ?search= changes coming from elsewhere (e.g. the home page search box)
  const urlSearch = params.get('search') || '';
  useEffect(() => { setQ(urlSearch); }, [urlSearch]);

  // deep link: /directory?id=<recordId> opens that record
  const deepId = params.get('id');
  useEffect(() => {
    if (!deepId) return;
    let cancelled = false;
    api.get(`/marhoomein/${deepId}`).then((r) => { if (!cancelled) setSelected(r.data.data); }).catch(() => {});
    return () => { cancelled = true; };
  }, [deepId]);

  const closeModal = () => {
    setSelected(null);
    if (params.get('id')) { const next = new URLSearchParams(params); next.delete('id'); setParams(next, { replace: true }); }
  };

  const clearFilters = () => { setQ(''); setWand('All'); setSort('newest'); };
  const filtered = Boolean(debouncedQ) || wand !== 'All';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-plum-500">Directory</p>
        <h1 className="text-3xl sm:text-5xl font-extrabold mt-1 text-plum-900">Marhoomein Directory</h1>
        <p className="text-muted mt-2 max-w-2xl">Gaoon Khayyan ke un tamam azeezon ki fehrist jo is duniya se rukhsat ho chuke hain.</p>
      </header>

      <div className="card p-4 sm:p-5 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-plum-400" size={18} aria-hidden="true" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Talash" placeholder="Marhoom ya waldiyat ka naam talash karein..." className="input !pl-11 !py-3" />
            {q && <button onClick={() => setQ('')} aria-label="Talash saaf karein" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"><FiX size={16} /></button>}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Tarteeb" className="input md:!w-52 !py-3">
            <option value="newest">Naye shamil pehle</option>
            <option value="demise">Tareekh-e-wafat (naya)</option>
            <option value="name">Naam (A–Z)</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Wand">
          {['All', ...WANDS].map((w) => (
            <button key={w} onClick={() => setWand(w)} aria-pressed={wand === w}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors cursor-pointer ${wand === w ? 'bg-plum-500 text-white border-plum-500' : 'bg-white text-plum-800 border-line hover:bg-plum-50'}`}>
              {w === 'All' ? 'Poora Gaoon' : w}
            </button>
          ))}
        </div>
      </div>

      {!loading && !error && <p className="text-sm text-muted font-medium mb-4" aria-live="polite">{total} record mile{filtered && ' (filter ke saath)'}</p>}

      {error ? <ErrorState message={error} onRetry={() => fetchPage(1, false)} /> : loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-80" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={FiUsers} title="Koi record nahi mila" text="Naam ki spelling dobara check karein ya doosri wand select karein."
          action={filtered && <button className="btn btn-primary" onClick={clearFilters}>Filter saaf karein</button>} />
      ) : (
        <>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map((p) => (
              <li key={p._id}>
                <button onClick={() => setSelected(p)} className="card card-white w-full h-full text-left overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer">
                  <Avatar src={p.imageName} name={p.name} className="w-full aspect-[4/4.2]" rounded="rounded-none" textSize="text-5xl" />
                  <div className="p-4 flex-1 flex flex-col">
                    <span className="badge badge-plum w-max">{(p.wand || '').replace(' Wand', '')}</span>
                    <h2 className="font-display text-lg font-bold mt-2 leading-snug">{p.name}</h2>
                    <p className="text-sm text-muted">Waldiyat: {p.fatherName}</p>
                    <p className="mt-auto pt-3 text-xs font-semibold text-plum-600 inline-flex items-center gap-1.5">
                      <FiCalendar size={13} /> {formatDate(p.dateOfDemise)}{p.dayOfWeek && <span className="text-muted font-medium">({dayLabel(p.dayOfWeek)})</span>}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {page < pages && (
            <div className="text-center mt-8">
              <button className="btn btn-ghost !px-8 !py-3" disabled={loadingMore} onClick={() => fetchPage(page + 1, true)}>
                {loadingMore ? 'Load ho raha hai...' : `Mazeed dekhein (${total - items.length} baqi)`}
              </button>
            </div>
          )}
        </>
      )}

      {selected && <RecordModal person={selected} onClose={closeModal} />}
    </div>
  );
}
