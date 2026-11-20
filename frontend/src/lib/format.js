const URDU_DAYS = {
  Monday: 'Peer', Tuesday: 'Mangal', Wednesday: 'Budh', Thursday: 'Jumerat',
  Friday: 'Juma', Saturday: 'Hafta', Sunday: 'Itwar',
};
export const dayLabel = (d) => (d ? `${URDU_DAYS[d] || d}` : '');

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export function formatDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d);
}

export function timeLeft(expiresAt) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return '';
  if (ms <= 0) return 'Expire ho raha hai';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h} ghante baqi` : `${m} minute baqi`;
}

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || '?';

export const hasPhoto = (url) => Boolean(url) && url !== 'cover.jpg';
