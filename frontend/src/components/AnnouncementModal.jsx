import { FiCalendar, FiMessageCircle, FiVolume2 } from 'react-icons/fi';
import Modal from './Modal';
import { formatDate } from '../lib/format';

export const typeBadge = (type) => (type === 'Vafat' ? 'badge-bad' : type === 'Soyem / Qul' ? 'badge-warn' : 'badge-ok');

export default function AnnouncementModal({ item, onClose }) {
  const shareText = `${item.title}\n\n${item.details}\n\n— Khayyan Memorial Portal\n${window.location.origin}`;
  return (
    <Modal onClose={onClose} title={item.title} size="max-w-xl" bare>
      <div className="p-6 sm:p-7">
        <div className="flex items-center gap-2 flex-wrap pr-10">
          <span className={`badge ${typeBadge(item.type)}`}>{item.type}</span>
          <span className="text-xs text-muted font-semibold inline-flex items-center gap-1"><FiCalendar size={12} /> {formatDate(item.date)}</span>
        </div>
        {item.image && <img src={item.image} alt={item.title} className="w-full max-h-80 object-contain rounded-2xl bg-white border border-line mt-4" />}
        <h2 className="text-2xl font-bold mt-4 leading-snug">{item.title}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/85 whitespace-pre-line bg-white border border-line rounded-2xl p-4">{item.details}</p>
        {item.audio && (
          <div className="mt-4 rounded-2xl bg-plum-50 border border-plum-100 p-4">
            <p className="text-xs font-bold text-plum-700 mb-2 inline-flex items-center gap-1.5"><FiVolume2 size={14} /> Awaaz mein elaan sunein</p>
            <audio src={item.audio} controls preload="none" className="w-full" />
          </div>
        )}
        <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-5 w-full">
          <FiMessageCircle size={16} /> WhatsApp par share karein
        </a>
      </div>
    </Modal>
  );
}
