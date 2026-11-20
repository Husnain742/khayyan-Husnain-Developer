import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiBell, FiClock, FiEdit2, FiInfo, FiMic, FiPlus, FiTrash2 } from 'react-icons/fi';
import { api, errMsg } from '../../lib/api';
import { ANNOUNCEMENT_TYPES } from '../../lib/constants';
import { formatDate, timeLeft } from '../../lib/format';
import { usePageTitle } from '../../lib/hooks';
import { useFeedback } from '../../components/Feedback';
import Modal from '../../components/Modal';
import { EmptyState, ErrorState, Skeleton } from '../../components/States';
import { typeBadge } from '../../components/AnnouncementModal';

const MAX_BYTES = 4 * 1024 * 1024;
const IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const todayISO = () => new Date().toISOString().slice(0, 10);

function AnnouncementForm({ item, onClose, onSaved }) {
  const editing = Boolean(item);
  const { toast } = useFeedback();
  const [form, setForm] = useState({
    type: item?.type || 'Vafat',
    date: item?.date?.slice(0, 10) || todayISO(),
    title: item?.title || '',
    details: item?.details || '',
  });
  const [image, setImage] = useState(null);
  const [audio, setAudio] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [removeAudio, setRemoveAudio] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const preview = useMemo(() => (image ? URL.createObjectURL(image) : ''), [image]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pick = (kind) => (e) => {
    const f = e.target.files?.[0];
    const setter = kind === 'image' ? setImage : setAudio;
    if (!f) return setter(null);
    if (kind === 'image' && !IMG_TYPES.includes(f.type)) { toast.error('Tasveer sirf JPG, PNG ya WebP honi chahiye.'); e.target.value = ''; return; }
    if (kind === 'audio' && !f.type.startsWith('audio/')) { toast.error('Sirf audio file chunein.'); e.target.value = ''; return; }
    if (f.size > MAX_BYTES) { toast.error('File 4MB se choti honi chahiye.'); e.target.value = ''; return; }
    setter(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (image) data.append('image', image);
      if (audio) data.append('audio', audio);
      if (editing && removeImage && !image) data.append('removeImage', 'true');
      if (editing && removeAudio && !audio) data.append('removeAudio', 'true');
      const res = editing ? await api.put(`/announcements/${item._id}`, data) : await api.post('/announcements', data);
      toast.success(editing ? 'Khabarnama update ho gaya.' : 'Khabarnama publish ho gaya.');
      onSaved(res.data.data);
    } catch (err) {
      setError(errMsg(err));
    } finally { setBusy(false); }
  };

  return (
    <Modal onClose={busy ? () => {} : onClose} title={editing ? 'Khabarnama tabdeel karein' : 'Naya khabarnama'} size="max-w-xl">
      {error && <div role="alert" className="mb-4 rounded-xl bg-bad-soft border border-[#f6c9d1] text-bad text-sm font-medium px-4 py-3">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label" htmlFor="af-type">Elaan ki kism</label>
            <select id="af-type" className="input" value={form.type} onChange={set('type')}>{ANNOUNCEMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
          <div><label className="label" htmlFor="af-date">Tareekh</label><input id="af-date" type="date" required className="input" value={form.date} onChange={set('date')} /></div>
        </div>
        <div><label className="label" htmlFor="af-title">Heading</label><input id="af-title" required minLength={3} maxLength={160} className="input" value={form.title} onChange={set('title')} placeholder="e.g. Chaudhary Muhammad Aslam Sahab Vafat Pa Gae Hain" /></div>
        <div><label className="label" htmlFor="af-details">Mukammal tafseelat</label>
          <textarea id="af-details" required minLength={3} maxLength={2000} rows={5} className="input resize-y" value={form.details} onChange={set('details')} placeholder="e.g. Namaz-e-Janaza aaj baad namaz-e-Asar (5:30 PM) Markazi Janazagah mein hogi." />
          <p className="text-[11px] text-muted text-right mt-1">{form.details.length}/2000</p></div>

        <div>
          <label className="label" htmlFor="af-img">Tasveer (optional)</label>
          {preview && <img src={preview} alt="Preview" className="w-24 h-24 object-cover object-top rounded-xl border border-line mb-2" />}
          {!preview && editing && item.image && !removeImage && <img src={item.image} alt="Maujooda tasveer" className="w-24 h-24 object-cover object-top rounded-xl border border-line mb-2" />}
          <input id="af-img" type="file" accept="image/jpeg,image/png,image/webp" onChange={pick('image')} className="w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-plum-100 file:text-plum-700 file:font-semibold file:px-4 file:py-2 cursor-pointer" />
          {editing && item.image && !image && <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-bad cursor-pointer"><input type="checkbox" checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} /> Maujooda tasveer hata dein</label>}
        </div>

        <div>
          <label className="label" htmlFor="af-audio"><FiMic className="inline -mt-0.5" size={13} /> Voice announcement (optional, MP3/M4A/WAV)</label>
          {editing && item.audio && !audio && !removeAudio && <audio src={item.audio} controls preload="none" className="w-full mb-2" />}
          <input id="af-audio" type="file" accept="audio/*" onChange={pick('audio')} className="w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-plum-100 file:text-plum-700 file:font-semibold file:px-4 file:py-2 cursor-pointer" />
          {editing && item.audio && !audio && <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-bad cursor-pointer"><input type="checkbox" checked={removeAudio} onChange={(e) => setRemoveAudio(e.target.checked)} /> Maujooda audio hata dein</label>}
        </div>

        <p className="text-xs text-muted flex gap-2 rounded-xl bg-plum-50 border border-plum-100 p-3"><FiInfo className="shrink-0 mt-0.5" size={14} /> Tasveer aur audio ka mushtarka size 4MB se kam rakhein. Khabarnama publish hone ke 24 ghante baad khud hat jata hai.</p>

        <div className="flex gap-3 justify-end pt-1">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Save ho raha hai...' : editing ? 'Update karein' : 'Publish karein'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Announcements() {
  usePageTitle('Khabarnama | Admin');
  const { toast, confirm } = useFeedback();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    setError(''); setItems(null);
    try { setItems((await api.get('/announcements')).data.data); }
    catch (err) { setError(errMsg(err)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (a) => {
    const ok = await confirm({ title: 'Khabarnama delete karein?', message: `"${a.title}" website se hat jayega.`, confirmText: 'Haan, delete karein', danger: true });
    if (!ok) return;
    try { await api.delete(`/announcements/${a._id}`); toast.success('Khabarnama delete ho gaya.'); load(); }
    catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <div className="space-y-6">
      <header className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-plum-900">Khabarnama & Elaanat</h1>
          <p className="text-muted mt-1">Vafat, soyem aur aam elaanat publish karein. Voice note bhi lagaya ja sakta hai.</p>
        </div>
        <button className="btn btn-primary self-start" onClick={() => setForm({ item: null })}><FiPlus size={16} /> Naya Elaan</button>
      </header>

      {error ? <ErrorState message={error} onRetry={load} /> : items === null ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={FiBell} title="Koi live elaan nahi" text="Naya khabarnama publish karein, wo foran home page par nazar aayega."
          action={<button className="btn btn-primary" onClick={() => setForm({ item: null })}><FiPlus size={16} /> Naya Elaan</button>} />
      ) : (
        <ul className="card card-white divide-y divide-line overflow-hidden">
          {items.map((a) => (
            <li key={a._id} className="p-4 sm:p-5 flex items-start gap-4">
              {a.image ? <img src={a.image} alt="" loading="lazy" className="w-16 h-16 rounded-xl object-cover object-top bg-cream-2 shrink-0" /> : <div className="w-16 h-16 rounded-xl bg-plum-50 text-plum-400 flex items-center justify-center shrink-0"><FiBell size={22} /></div>}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`badge ${typeBadge(a.type)}`}>{a.type}</span>
                  <span className="text-xs text-muted font-medium">{formatDate(a.date)}</span>
                  {a.audio && <span className="badge badge-plum"><FiMic size={11} /> Audio</span>}
                </div>
                <h2 className="font-bold mt-1.5 leading-snug">{a.title}</h2>
                <p className="text-sm text-muted line-clamp-1 mt-0.5">{a.details}</p>
                <p className="text-xs font-semibold text-warn mt-1.5 inline-flex items-center gap-1"><FiClock size={12} /> {timeLeft(a.expiresAt)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="btn btn-ghost btn-sm !px-3" onClick={() => setForm({ item: a })} aria-label="Edit"><FiEdit2 size={15} /></button>
                <button className="btn btn-danger btn-sm !px-3" onClick={() => remove(a)} aria-label="Delete"><FiTrash2 size={15} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {form && <AnnouncementForm item={form.item} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
    </div>
  );
}
