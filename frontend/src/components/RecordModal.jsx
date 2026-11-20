import { FiCalendar, FiCopy, FiMessageCircle } from 'react-icons/fi';
import Modal from './Modal';
import Avatar from './Avatar';
import { useFeedback } from './Feedback';
import { dayLabel, formatDate, hasPhoto } from '../lib/format';

export default function RecordModal({ person, onClose }) {
  const { toast } = useFeedback();
  const link = `${window.location.origin}/directory?id=${person._id}`;
  const text = `Marhoom: ${person.name}\nWaldiyat: ${person.fatherName}\nTareekh-e-Wafat: ${formatDate(person.dateOfDemise)}\n\nAllah maghfirat farmaye. Ameen.\n${link}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); toast.success('Link copy ho gaya.'); }
    catch { toast.error('Link copy nahi ho saka.'); }
  };

  return (
    <Modal onClose={onClose} title={person.name} size="max-w-3xl" bare>
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/2 bg-plum-50 min-h-[280px] md:min-h-[420px] relative">
          {hasPhoto(person.imageName)
            ? <img src={person.imageName} alt={person.name} className="absolute inset-0 w-full h-full object-contain" />
            : <div className="absolute inset-0 flex items-center justify-center"><Avatar name={person.name} className="w-32 h-32" rounded="rounded-full" textSize="text-4xl" /></div>}
        </div>
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-center">
          <span className="badge badge-plum w-max">{person.wand}</span>
          <h2 className="text-3xl font-extrabold mt-3 leading-tight">{person.name}</h2>
          <p className="text-muted mt-1">Waldiyat: <span className="font-bold text-ink">{person.fatherName}</span></p>

          <div className="mt-5 rounded-2xl bg-white border border-line p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Tareekh-e-Wafat</p>
            <p className="font-bold text-lg mt-1 inline-flex items-center gap-2"><FiCalendar size={16} className="text-plum-500" /> {formatDate(person.dateOfDemise)}</p>
            {person.dayOfWeek && <p className="text-sm text-plum-600 font-semibold mt-1">Din: {dayLabel(person.dayOfWeek)}</p>}
          </div>

          <p className="mt-5 text-sm text-muted font-medium">Allah marhoom ki maghfirat farmaye aur jannat-ul-firdaus mein jagah ata farmaye. Ameen.</p>

          <div className="mt-5 flex gap-3">
            <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary flex-1"><FiMessageCircle size={16} /> WhatsApp</a>
            <button onClick={copy} className="btn btn-ghost" aria-label="Link copy karein"><FiCopy size={16} /> Copy</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
