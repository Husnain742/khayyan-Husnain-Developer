import { useEffect, useMemo, useState } from 'react';
import { FiImage } from 'react-icons/fi';
import Modal from '../../components/Modal';
import Avatar from '../../components/Avatar';
import { useFeedback } from '../../components/Feedback';
import { api, errMsg } from '../../lib/api';
import { WANDS } from '../../lib/constants';
import { dayLabel, hasPhoto } from '../../lib/format';

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function RecordForm({ record, onClose, onSaved }) {
  const editing = Boolean(record);
  const { toast, confirm } = useFeedback();
  const [form, setForm] = useState({
    name: record?.name || '',
    fatherName: record?.fatherName || '',
    wand: record?.wand || WANDS[0],
    dateOfDemise: record?.dateOfDemise || '',
  });
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const day = useMemo(() => {
    if (!form.dateOfDemise) return '';
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${form.dateOfDemise}T00:00:00Z`));
  }, [form.dateOfDemise]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return setFile(null);
    if (!TYPES.includes(f.type)) { toast.error('Tasveer sirf JPG, PNG ya WebP honi chahiye.'); e.target.value = ''; return; }
    if (f.size > MAX_BYTES) { toast.error('Tasveer 4MB se choti honi chahiye.'); e.target.value = ''; return; }
    setFile(f); setRemoveImage(false);
  };

  const send = async (confirmDuplicate) => {
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    if (file) data.append('image', file);
    if (editing && removeImage) data.append('removeImage', 'true');
    if (confirmDuplicate) data.append('confirmDuplicate', 'true');
    return editing ? api.put(`/marhoomein/${record._id}`, data) : api.post('/marhoomein', data);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      let res;
      try {
        res = await send(false);
      } catch (err) {
        if (err.response?.status === 409 && err.response.data?.duplicate) {
          const ok = await confirm({
            title: 'Shayad ye record pehle se hai',
            message: `"${form.name}" (waldiyat: ${form.fatherName}) ke naam ka record pehle se mojood hai. Phir bhi naya record shamil karein?`,
            confirmText: 'Haan, shamil karein',
          });
          if (!ok) { setBusy(false); return; }
          res = await send(true);
        } else throw err;
      }
      toast.success(editing ? 'Record update ho gaya.' : 'Naya record shamil ho gaya.');
      onSaved(res.data.data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const currentPhoto = !removeImage && hasPhoto(record?.imageName) ? record.imageName : '';

  return (
    <Modal onClose={busy ? () => {} : onClose} title={editing ? 'Record tabdeel karein' : 'Naya marhoom shamil karein'} size="max-w-xl">
      {error && <div role="alert" className="mb-4 rounded-xl bg-bad-soft border border-[#f6c9d1] text-bad text-sm font-medium px-4 py-3">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label" htmlFor="rf-name">Marhoom ka naam</label><input id="rf-name" className="input" required minLength={2} maxLength={100} value={form.name} onChange={set('name')} placeholder="Naam" /></div>
          <div><label className="label" htmlFor="rf-father">Waldiyat</label><input id="rf-father" className="input" required minLength={2} maxLength={100} value={form.fatherName} onChange={set('fatherName')} placeholder="Walid ka naam" /></div>
          <div><label className="label" htmlFor="rf-wand">Gaoon ka hissa (Wand)</label>
            <select id="rf-wand" className="input" value={form.wand} onChange={set('wand')}>{WANDS.map((w) => <option key={w}>{w}</option>)}</select></div>
          <div><label className="label" htmlFor="rf-date">Tareekh-e-wafat</label>
            <input id="rf-date" type="date" className="input" required max={todayISO()} value={form.dateOfDemise} onChange={set('dateOfDemise')} />
            {day && <p className="mt-1.5 text-xs font-semibold text-plum-600">Din: {dayLabel(day)} ({day})</p>}</div>
        </div>

        <div>
          <label className="label" htmlFor="rf-photo">Tasveer {editing ? '(badalne ke liye naya chunein)' : '(optional)'}</label>
          <div className="flex items-center gap-4">
            {preview ? <img src={preview} alt="Preview" className="w-20 h-20 rounded-xl object-cover object-top border border-line" />
              : currentPhoto ? <Avatar src={currentPhoto} name={form.name} className="w-20 h-20" />
              : <div className="w-20 h-20 rounded-xl bg-plum-50 border border-dashed border-plum-200 text-plum-400 flex items-center justify-center"><FiImage size={24} /></div>}
            <div className="flex-1 min-w-0">
              <input id="rf-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={pickFile} className="w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-plum-100 file:text-plum-700 file:font-semibold file:px-4 file:py-2 hover:file:bg-plum-200 cursor-pointer" />
              <p className="text-xs text-muted mt-1">JPG / PNG / WebP, 4MB tak.</p>
              {editing && hasPhoto(record?.imageName) && !file && (
                <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-bad cursor-pointer"><input type="checkbox" checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} /> Maujooda tasveer hata dein</label>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Save ho raha hai...' : editing ? 'Save Changes' : 'Record shamil karein'}</button>
        </div>
      </form>
    </Modal>
  );
}
