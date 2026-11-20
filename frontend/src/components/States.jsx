import { FiAlertTriangle, FiInbox, FiRefreshCw } from 'react-icons/fi';

export function Spinner({ label = 'Load ho raha hai...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted" role="status">
      <div className="w-9 h-9 rounded-full border-[3px] border-plum-200 border-t-plum-500 animate-spin" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card card-white text-center py-12 px-6 max-w-md mx-auto" role="alert">
      <div className="w-12 h-12 mx-auto rounded-full bg-bad-soft text-bad flex items-center justify-center mb-4"><FiAlertTriangle size={22} /></div>
      <p className="font-bold text-lg">Data load nahi ho saka</p>
      <p className="text-sm text-muted mt-1">{message || 'Thori der baad dobara koshish karein.'}</p>
      {onRetry && <button onClick={onRetry} className="btn btn-primary mt-5"><FiRefreshCw size={16} /> Dobara koshish karein</button>}
    </div>
  );
}

export function EmptyState({ icon: Icon = FiInbox, title, text, action }) {
  return (
    <div className="text-center py-14 px-6 rounded-3xl border border-dashed border-plum-200 bg-white/60">
      <div className="w-14 h-14 mx-auto rounded-full bg-plum-100 text-plum-500 flex items-center justify-center mb-4"><Icon size={24} /></div>
      <p className="font-bold text-lg font-display">{title}</p>
      {text && <p className="text-sm text-muted mt-1 max-w-sm mx-auto">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const Skeleton = ({ className = '' }) => <div className={`skeleton ${className}`} aria-hidden="true" />;
