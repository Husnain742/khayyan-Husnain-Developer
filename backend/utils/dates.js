const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function isValidISODate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function dayNameOf(isoDate) {
  return DAYS[new Date(`${isoDate}T00:00:00Z`).getUTCDay()];
}

export function todayPlusOneISO() {
  return new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);
}

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
