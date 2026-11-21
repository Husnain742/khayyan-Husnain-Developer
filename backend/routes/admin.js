import crypto from 'node:crypto';
import express from 'express';
import Marhoom from '../models/Marhoom.js';
import Announcement, { ANNOUNCEMENT_TTL_SECONDS } from '../models/Announcement.js';
import AuditLog, { audit } from '../models/AuditLog.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAdmin); // every route in this file is admin-only

const NO_PHOTO = { $or: [{ imageName: '' }, { imageName: 'cover.jpg' }, { imageName: { $exists: false } }] };

const MAX_MS = 5000;            // a slow query must fail fast instead of hanging until Vercel kills the function
const MAX_STATS_DOCS = 50000;   // safety cap for the chart statistics
const OVERVIEW_QUERY_COUNT = 7;

/**
 * Runs ONE dashboard query. If it throws, the real reason is logged (Vercel > Logs) and `fallback`
 * is returned, so one failing query can never turn the whole dashboard into a 500.
 */
async function safeQuery(ctx, name, fn, fallback) {
  try {
    return await fn();
  } catch (err) {
    ctx.warnings.push(name);
    console.error(JSON.stringify({
      level: 'error', where: 'GET /api/admin/overview', query: name, ref: ctx.ref,
      errName: err?.name, code: err?.code, codeName: err?.codeName,
      message: String(err?.message || '').slice(0, 300),
    }));
    return fallback;
  }
}

/** createdAt + ttl as an ISO string, or null when createdAt is missing/invalid (never throws). */
function expiryISO(createdAt, ttlSeconds) {
  const t = new Date(createdAt).getTime();
  if (!createdAt || Number.isNaN(t)) return null;
  return new Date(t + ttlSeconds * 1000).toISOString();
}

// ---- chart statistics, computed in JS (no MongoDB aggregation => no aggregation-specific failure modes) ----
function yearOf(v) {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : String(v.getUTCFullYear());
  const m = /^(\d{4})/.exec(String(v ?? ''));
  return m ? m[1] : null;
}

function buildStats(rows) {
  const wands = new Map();
  const years = new Map();
  for (const r of rows) {
    const w = (typeof r?.wand === 'string' && r.wand.trim()) || 'Unknown';
    wands.set(w, (wands.get(w) || 0) + 1);
    const y = yearOf(r?.dateOfDemise);
    if (y) years.set(y, (years.get(y) || 0) + 1);
  }
  const byWand = [...wands].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  const byYear = [...years].map(([label, count]) => ({ label, count }))
    .sort((a, b) => (a.label < b.label ? 1 : -1)) // newest 10 years ...
    .slice(0, 10)
    .reverse();                                    // ... shown oldest -> newest
  return { byWand, byYear };
}

router.get('/overview', async (req, res) => {
  const ctx = { ref: crypto.randomUUID().slice(0, 8), warnings: [] };
  const q = (name, fn, fallback) => safeQuery(ctx, name, fn, fallback);
  const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [total, noPhoto, added30, statRows, recent, announcementsRaw, activity] = await Promise.all([
    q('records.total', () => Marhoom.countDocuments({}).maxTimeMS(MAX_MS), 0),
    q('records.noPhoto', () => Marhoom.countDocuments(NO_PHOTO).maxTimeMS(MAX_MS), 0),
    q('records.added30', () => Marhoom.countDocuments({ createdAt: { $gte: since30 } }).maxTimeMS(MAX_MS), 0),
    q('records.stats', () => Marhoom.find({}, { wand: 1, dateOfDemise: 1 }).limit(MAX_STATS_DOCS).maxTimeMS(MAX_MS).lean(), []),
    q('records.recent', () => Marhoom.find().sort({ createdAt: -1 }).limit(6).maxTimeMS(MAX_MS).lean(), []),
    q('announcements', () => Announcement.find().sort({ createdAt: -1 }).limit(20).maxTimeMS(MAX_MS).lean(), []),
    q('activity', () => AuditLog.find().sort({ at: -1 }).limit(8).maxTimeMS(MAX_MS).lean(), []),
  ]);

  // Every query failed => the database itself is unreachable. Say so (503) instead of showing a fake empty dashboard.
  if (ctx.warnings.length >= OVERVIEW_QUERY_COUNT) {
    return res.status(503).json({ success: false, message: 'Database abhi available nahi hai. Thori der baad try karein.', requestId: ctx.ref });
  }

  const { byWand, byYear } = buildStats(statRows);

  const announcements = announcementsRaw
    .map((a) => ({ _id: a._id, type: a.type || '', title: a.title || '', expiresAt: expiryISO(a.createdAt, ANNOUNCEMENT_TTL_SECONDS) }))
    .filter((a) => a.expiresAt); // a doc without a valid createdAt can no longer crash the dashboard

  res.set('Cache-Control', 'no-store');
  res.json({
    success: true,
    partial: ctx.warnings.length > 0, // extra info only; the existing frontend ignores it
    warnings: ctx.warnings,
    data: {
      totals: { records: total, noPhoto, added30, announcements: announcements.length },
      byWand,
      byYear,
      recent,
      announcements,
      activity,
    },
  });
});

router.get('/audit', async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const items = await AuditLog.find().sort({ at: -1 }).limit(limit).lean();
  res.json({ success: true, data: items });
});

// CSV backup of all records. Cells starting with = + - @ are neutralised (spreadsheet formula injection).
const csvCell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

router.get('/export.csv', async (req, res) => {
  const rows = await Marhoom.find().sort({ dateOfDemise: -1 }).lean();
  const header = ['Name', 'Father Name', 'Wand', 'Date of Demise', 'Day', 'Photo URL', 'Added On'];
  const lines = [header.map(csvCell).join(',')];
  for (const r of rows) {
    lines.push([r.name, r.fatherName, r.wand, r.dateOfDemise, r.dayOfWeek, r.imageName, r.createdAt?.toISOString?.() || ''].map(csvCell).join(','));
  }
  await audit(req, 'export', 'marhoom', '', `Exported ${rows.length} records`);
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="khayyan-records-${new Date().toISOString().slice(0, 10)}.csv"`,
    'Cache-Control': 'no-store',
  });
  res.send(`\uFEFF${lines.join('\r\n')}`);
});

export default router;
