import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiActivity, FiArrowRight, FiBell, FiCalendar, FiHome, FiLink, FiMapPin, FiMoon, FiPhone, FiSearch, FiUser, FiUsers, FiVolume2 } from 'react-icons/fi';
import { api, errMsg } from '../lib/api';
import { WANDS } from '../lib/constants';
import { formatDate } from '../lib/format';
import { usePageTitle } from '../lib/hooks';
import { ErrorState, Skeleton } from '../components/States';
import Modal from '../components/Modal';
import AnnouncementModal, { typeBadge } from '../components/AnnouncementModal';

const CONTACT_ICONS = { phone: FiPhone, mosque: FiMoon, ambulance: FiActivity, grave: FiMapPin, person: FiUser };
const CONTRIBUTORS = {
  dev: { name: 'Muhammad Husnain', role: 'Lead Developer', photo: '/Husnain.jpg', bio: 'Is platform ka poora architecture aur UI design kiya hai taaki marhoomein ka record dhoondna aasan aur har device par responsive ho.' },
  data: { name: 'Zohaib Warraich', role: 'Data & Records Provider', photo: '/Zohaib.jpg', bio: 'Marhoomein ki darust aur authentic details ikatha karne mein ahem kirdar ada kiya hai.' },
};

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-plum-100 text-plum-600 flex items-center justify-center shrink-0"><Icon size={22} /></div>
      <div>
        <p className="font-display text-3xl font-extrabold text-plum-800 leading-none">{value ?? '—'}</p>
        <p className="text-sm text-muted font-medium mt-1">{label}</p>
      </div>
    </div>
  );
}

export default function Home() {
  usePageTitle('');
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState(null);
  const [announcements, setAnnouncements] = useState(null);
  const [annError, setAnnError] = useState('');
  const [openAnn, setOpenAnn] = useState(null);
  const [person, setPerson] = useState(null);

  const loadAnnouncements = useCallback(async () => {
    setAnnError('');
    setAnnouncements(null);
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data.data);
    } catch (err) {
      setAnnError(errMsg(err));
    }
  }, []);

  useEffect(() => {
    api.get('/settings').then((r) => setSettings(r.data.data)).catch(() => setSettings({}));
    loadAnnouncements();
  }, [loadAnnouncements]);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/directory?search=${encodeURIComponent(q)}` : '/directory');
  };

  const contacts = settings?.contacts || [];

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_85%_10%,rgb(226_201_213/0.55),transparent),radial-gradient(40%_40%_at_0%_100%,rgb(246_236_214/0.7),transparent)]" aria-hidden="true" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-14 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="badge badge-plum !text-xs !py-1.5 !px-3 tracking-wide uppercase">Digital Memorial Record</span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.1] text-plum-900">
              Gaoon Khayyan ke marhoomein ki yaad, <span className="text-plum-500">hamesha mehfooz.</span>
            </h1>
            <p className="mt-5 text-lg text-muted max-w-xl leading-relaxed">
              Marhoomein ka mukammal record, taaza khabarnama aur dua-e-maghfirat ke liye zaroori maloomat — ek hi jagah, har waqt.
            </p>

            <form onSubmit={submitSearch} role="search" className="mt-8 flex items-center bg-white border border-line rounded-full p-1.5 pl-5 shadow-[0_10px_30px_-12px_rgb(87_43_76/0.35)] focus-within:ring-4 focus-within:ring-plum-200/60 max-w-xl">
              <FiSearch className="text-plum-400 shrink-0" size={20} aria-hidden="true" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} type="search" aria-label="Marhoom ka naam talash karein" placeholder="Marhoom ya waldiyat ka naam likhein..." className="flex-1 min-w-0 bg-transparent px-3 py-3 text-[15px] outline-none placeholder:text-[#a8999f]" />
              <button type="submit" className="btn btn-primary !py-3 !px-6">Talash</button>
            </form>

            <div className="mt-5 flex flex-wrap gap-2" aria-label="Wand ke hisaab se dekhein">
              {WANDS.map((w) => (
                <Link key={w} to={`/directory?wand=${encodeURIComponent(w)}`} className="badge badge-plum !text-xs !py-1.5 !px-3 hover:bg-plum-200 transition-colors">{w}</Link>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/directory" className="btn btn-primary !py-3 !px-6">Directory dekhein <FiArrowRight size={16} /></Link>
              <a href="#khabarnama" className="btn btn-ghost !py-3 !px-6"><FiBell size={16} /> Taaza khabarnama</a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-3 rounded-t-[999px] rounded-b-[2rem] bg-gradient-to-b from-plum-200 to-gold-soft -z-10 rotate-2" aria-hidden="true" />
            <img src="/Khayyan.jpg" alt="Gaoon Khayyan" className="w-full aspect-[4/5] object-cover object-top rounded-t-[999px] rounded-b-[2rem] border-4 border-white shadow-xl" />
            <div className="absolute -bottom-5 -left-3 sm:-left-6 card card-white px-5 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold-soft text-gold flex items-center justify-center"><FiUsers size={18} /></div>
              <div>
                <p className="font-display text-2xl font-extrabold text-plum-800 leading-none">{settings?.totalRecords ?? '—'}</p>
                <p className="text-xs text-muted font-semibold">Marhoomein ka record</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- STATS ---------------- */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard icon={FiUsers} value={settings?.totalRecords} label="Total Records" />
          <StatCard icon={FiHome} value={settings?.familiesCount} label="Khandan / Families" />
          <StatCard icon={FiLink} value={settings?.shajraCount} label="Shajra-e-Nasab" />
        </div>
      </section>

      {/* ---------------- KHABARNAMA ---------------- */}
      <section id="khabarnama" className="max-w-6xl mx-auto px-4 sm:px-6 mt-20 scroll-mt-24">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-plum-500">Khabarnama</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-1">Nayi Updates & Elaanat</h2>
          <p className="text-muted mt-1">Vafat, soyem aur zaroori elaanat — taaza tareen pehle.</p>
        </div>

        {annError ? <ErrorState message={annError} onRetry={loadAnnouncements} /> : announcements === null ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64" />)}</div>
        ) : announcements.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-plum-200 bg-white/60 text-center py-12 text-muted font-medium">Filhal koi naya elaan mojood nahi hai.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {announcements.map((a) => (
              <button key={a._id} onClick={() => setOpenAnn(a)} className="card card-white text-left p-5 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer">
                <div className="flex items-center justify-between gap-2">
                  <span className={`badge ${typeBadge(a.type)}`}>{a.type}</span>
                  <span className="text-xs text-muted font-semibold inline-flex items-center gap-1"><FiCalendar size={12} /> {formatDate(a.date)}</span>
                </div>
                {a.image && <img src={a.image} alt="" loading="lazy" className="w-full h-44 object-cover object-top rounded-xl bg-cream-2" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                <h3 className="text-lg font-bold leading-snug line-clamp-2">{a.title}</h3>
                <p className="text-sm text-muted line-clamp-2">{a.details}</p>
                <div className="mt-auto pt-1 flex items-center justify-between text-sm font-semibold text-plum-600">
                  <span>Mukammal dekhein</span>
                  {a.audio ? <span className="inline-flex items-center gap-1 text-xs text-plum-500"><FiVolume2 size={14} /> Audio</span> : <FiArrowRight size={16} />}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ---------------- CONTACTS ---------------- */}
      {contacts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-20">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-plum-500">Rabta</p>
            <h2 className="text-3xl sm:text-4xl font-bold mt-1">Gaoon ke Zaroori Numbers</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((c) => {
              const Icon = CONTACT_ICONS[c.icon] || FiPhone;
              return (
                <a key={`${c.label}-${c.phone}`} href={`tel:${c.phone.replace(/[^+\d]/g, '')}`} className="card card-white p-4 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-plum-100 text-plum-600 flex items-center justify-center shrink-0"><Icon size={20} /></div>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{c.label}</p>
                    <p className="text-sm text-muted font-medium">{c.phone}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* ---------------- MAP ---------------- */}
      {settings?.mapUrl && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-16">
          <div className="rounded-3xl bg-gradient-to-r from-plum-100 to-gold-soft border border-plum-200/70 p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-5 justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white text-plum-600 flex items-center justify-center shrink-0 border border-plum-100"><FiMapPin size={22} /></div>
              <div>
                <h3 className="text-xl font-bold">Qabristan ka rasta</h3>
                <p className="text-sm text-muted mt-1 max-w-xl">Janaze ya dua-e-maghfirat ke liye baahir se aane walon ke liye seedha Google Maps location.</p>
              </div>
            </div>
            <a href={settings.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary !py-3 !px-6 shrink-0">Google Maps mein kholein</a>
          </div>
        </section>
      )}

      {/* ---------------- CONTRIBUTORS ---------------- */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-20">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-plum-500">Team</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-1">App Contributors</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {Object.entries(CONTRIBUTORS).map(([key, c]) => (
            <button key={key} onClick={() => setPerson(c)} className="card card-white w-72 p-7 text-center hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer">
              <img src={c.photo} alt={c.name} loading="lazy" className="w-32 h-32 mx-auto rounded-full object-cover object-top border-4 border-plum-100" />
              <h3 className="text-xl font-bold mt-4">{c.name}</h3>
              <p className="text-xs font-bold uppercase tracking-wider text-plum-500 mt-1">{c.role}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-plum-600 mt-4">Bio dekhein <FiArrowRight size={14} /></span>
            </button>
          ))}
        </div>
      </section>

      {/* ---------------- QUOTE ---------------- */}
      <section className="max-w-3xl mx-auto px-6 mt-20 text-center">
        <p dir="rtl" lang="ar" className="font-arabic text-3xl sm:text-4xl leading-loose text-plum-700">كُلُّ نَفْسٍ ذَائِقَةُ الْمَوْتِ</p>
        <p className="text-muted mt-2">Har jaandaar ko maut ka maza chakhna hai. Allah sab marhoomein ke darajaat buland farmaye. Ameen.</p>
      </section>

      {openAnn && <AnnouncementModal item={openAnn} onClose={() => setOpenAnn(null)} />}
      {person && (
        <Modal onClose={() => setPerson(null)} title={person.name} size="max-w-2xl" bare>
          <div className="flex flex-col sm:flex-row">
            <img src={person.photo} alt={person.name} className="w-full sm:w-2/5 h-64 sm:h-auto object-cover object-top" />
            <div className="p-6 sm:p-8 flex flex-col justify-center">
              <span className="badge badge-plum w-max">{person.role}</span>
              <h2 className="text-3xl font-extrabold mt-3">{person.name}</h2>
              <p className="text-muted mt-4 leading-relaxed">{person.bio}</p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
