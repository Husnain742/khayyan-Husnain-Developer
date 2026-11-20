import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

export default function Modal({ onClose, title, children, size = 'max-w-lg', bare = false }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-plum-900/60 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className={`pop relative w-full ${size} max-h-[92vh] overflow-y-auto bg-cream rounded-t-3xl sm:rounded-3xl shadow-2xl border border-line`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Band karein" className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 border border-line text-plum-800 hover:bg-white flex items-center justify-center cursor-pointer">
          <FiX size={18} />
        </button>
        {bare ? children : (
          <div className="p-6 sm:p-7">
            {title && <h2 className="text-2xl font-bold pr-10 mb-5">{title}</h2>}
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
