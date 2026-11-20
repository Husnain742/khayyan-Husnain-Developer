import { useEffect, useState } from 'react';
import { FiInfo, FiPlus, FiTrash2 } from 'react-icons/fi';
import { api, errMsg } from '../../lib/api';
import { CONTACT_ICON_OPTIONS } from '../../lib/constants';
import { usePageTitle } from '../../lib/hooks';
import { useFeedback } from '../../components/Feedback';
import { ErrorState, Skeleton } from '../../components/States';

export default function Settings() {
  usePageTitle('Settings | Admin');
  const { toast } = useFeedback();
  const [form, setForm] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoadError('');
    try {
      const d = (await api.get('/settings')).data.data;
      setForm({ familiesCount: d.familiesCount, shajraCount: d.shajraCount, mapUrl: d.mapUrl || '', contacts: d.contacts || [] });
    } catch (err) { setLoadError(errMsg(err)); }
  };
  useEffect(() => { load(); }, []);

  if (loadError) return <ErrorState message={loadError} onRetry={load} />;
  if (!form) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>;

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setContact = (i, k, v) => setForm((f) => ({ ...f, contacts: f.contacts.map((c, idx) => (idx === i ? { ...c, [k]: v } : c)) }));
  const addContact = () => setForm((f) => ({ ...f, contacts: [...f.contacts, { label: '', phone: '', icon: 'phone' }] }));
  const removeContact = (i) => setForm((f) => ({ ...f, contacts: f.contacts.filter((_, idx) => idx !== i) }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put('/settings', form);
      toast.success('Settings save ho gayin.');
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <header className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-plum-900">Portal Settings</h1>
          <p className="text-muted mt-1">Home page ke counters, zaroori numbers aur qabristan ka map link.</p>
        </div>
        <button type="submit" className="btn btn-primary self-start" disabled={busy}>{busy ? 'Save ho raha hai...' : 'Save Settings'}</button>
      </header>

      <section className="card p-6">
        <h2 className="text-xl font-bold mb-4">Live Counters</h2>
        <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
          <div><label className="label" htmlFor="s-fam">Khandan / Families</label><input id="s-fam" className="input" required maxLength={12} value={form.familiesCount} onChange={setField('familiesCount')} placeholder="120+" /></div>
          <div><label className="label" htmlFor="s-sh">Shajra-e-Nasab</label><input id="s-sh" className="input" required maxLength={12} value={form.shajraCount} onChange={setField('shajraCount')} placeholder="50+" /></div>
        </div>
        <p className="text-xs text-muted mt-3">"Total Records" ka number khud ba khud records se aata hai.</p>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Zaroori Numbers</h2>
          {form.contacts.length < 8 && <button type="button" className="btn btn-ghost btn-sm" onClick={addContact}><FiPlus size={15} /> Number shamil karein</button>}
        </div>
        {form.contacts.length === 0 ? (
          <p className="text-sm text-muted rounded-xl bg-white border border-dashed border-plum-200 p-5">Abhi koi number nahi. Jab tak yahan number na hon, home page par ye hissa nazar nahi aata.</p>
        ) : (
          <ul className="space-y-3">
            {form.contacts.map((c, i) => (
              <li key={i} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1fr_9rem_auto] gap-3 items-end bg-white border border-line rounded-2xl p-3">
                <div><label className="label">Naam / Idara</label><input className="input" required maxLength={40} value={c.label} onChange={(e) => setContact(i, 'label', e.target.value)} placeholder="Qabristan Committee" /></div>
                <div><label className="label">Phone</label><input className="input" required inputMode="tel" maxLength={20} value={c.phone} onChange={(e) => setContact(i, 'phone', e.target.value)} placeholder="+92 300 1234567" /></div>
                <div><label className="label">Icon</label><select className="input" value={c.icon} onChange={(e) => setContact(i, 'icon', e.target.value)}>{CONTACT_ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                <button type="button" className="btn btn-danger btn-sm !px-3 !py-3 justify-self-end" onClick={() => removeContact(i)} aria-label="Number hata dein"><FiTrash2 size={15} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-6">
        <h2 className="text-xl font-bold mb-4">Qabristan Map Link</h2>
        <label className="label" htmlFor="s-map">Google Maps link (https://...)</label>
        <input id="s-map" type="url" maxLength={500} className="input" value={form.mapUrl} onChange={setField('mapUrl')} placeholder="https://maps.app.goo.gl/..." />
        <p className="text-xs text-muted mt-2">Khali chorein to map ka hissa home page par nahi dikhega.</p>
      </section>

      <section className="rounded-2xl border border-plum-200 bg-plum-50 p-5 text-sm text-plum-800">
        <p className="font-bold flex items-center gap-2"><FiInfo size={16} /> Admin email ya password badalna</p>
        <p className="mt-2 leading-relaxed">Security ke liye ye website se nahi badla ja sakta. Backend project ka <code className="font-mono bg-white px-1.5 py-0.5 rounded">npm run hash-password</code> chala kar naya hash banayein, phir Vercel ke Environment Variables mein <code className="font-mono bg-white px-1.5 py-0.5 rounded">ADMIN_PASSWORD_HASH</code> (ya <code className="font-mono bg-white px-1.5 py-0.5 rounded">ADMIN_EMAIL</code>) badal kar redeploy karein. <code className="font-mono bg-white px-1.5 py-0.5 rounded">JWT_SECRET</code> badalne se tamam purane login session foran khatam ho jate hain.</p>
      </section>
    </form>
  );
}
