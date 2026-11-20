import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiX, FiXCircle } from 'react-icons/fi';

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((kind, message) => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, kind, message }]);
    setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500);
  }, [dismiss]);

  const confirm = useCallback((opts) => new Promise((resolve) => setDialog({ ...opts, resolve })), []);
  const closeDialog = (result) => { dialog?.resolve(result); setDialog(null); };

  const value = useMemo(() => ({
    toast: { success: (m) => push('success', m), error: (m) => push('error', m) },
    confirm,
  }), [push, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[70] flex flex-col gap-2 sm:w-96" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`pop flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg text-sm font-medium bg-white ${t.kind === 'error' ? 'border-[#f6c9d1] text-bad' : 'border-[#c4e6d4] text-ok'}`}>
            {t.kind === 'error' ? <FiXCircle className="mt-0.5 shrink-0" size={18} /> : <FiCheckCircle className="mt-0.5 shrink-0" size={18} />}
            <span className="flex-1 text-ink">{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Band karein" className="text-muted hover:text-ink cursor-pointer"><FiX size={16} /></button>
          </div>
        ))}
      </div>

      {dialog && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-plum-900/60 backdrop-blur-sm" onClick={() => closeDialog(false)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="pop card card-white max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 ${dialog.danger ? 'bg-bad-soft text-bad' : 'bg-plum-100 text-plum-600'}`}>
              <FiAlertTriangle size={20} />
            </div>
            <h3 id="confirm-title" className="text-xl font-bold">{dialog.title || 'Kya aap yaqeen se hain?'}</h3>
            {dialog.message && <p className="text-sm text-muted mt-2 leading-relaxed">{dialog.message}</p>}
            <div className="flex gap-3 justify-end mt-6">
              <button className="btn btn-ghost" onClick={() => closeDialog(false)} autoFocus>{dialog.cancelText || 'Nahi, wapas'}</button>
              <button className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => closeDialog(true)}>{dialog.confirmText || 'Haan, jari rakhein'}</button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used inside FeedbackProvider');
  return ctx;
}
