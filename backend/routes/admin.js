import express from 'express';
import Marhoom from '../models/Marhoom.js';
import Announcement, { ANNOUNCEMENT_TTL_SECONDS } from '../models/Announcement.js';
import AuditLog, { audit } from '../models/AuditLog.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAdmin); // every route in this file is admin-only

const NO_PHOTO = { $or: [{ imageName: '' }, { imageName: 'cover.jpg' }, { imageName: { $exists: false } }] };

router.get('/overview', async (req, res) => {
  const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const [total, noPhoto, added30, byWand, byYear, recent, announcements, activity] = await Promise.all([
    Marhoom.estimatedDocumentCount(),
    Marhoom.countDocuments(NO_PHOTO),
    Marhoom.countDocuments({ createdAt: { $gte: since30 } }),
    Marhoom.aggregate([{ $group: { _id: '$wand', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Marhoom.aggregate([
      { $group: { _id: { $substrCP: ['$dateOfDemise', 0, 4] }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 10 },
    ]),
    Marhoom.find().sort({ createdAt: -1 }).limit(6).lean(),
    Announcement.find().sort({ createdAt: -1 }).limit(20).lean(),
    AuditLog.find().sort({ at: -1 }).limit(8).lean(),
  ]);

  res.json({
    success: true,
    data: {
      totals: { records: total, noPhoto, added30, announcements: announcements.length },
      byWand: byWand.map((r) => ({ label: r._id || 'Unknown', count: r.count })),
      byYear: byYear.map((r) => ({ label: r._id, count: r.count })).reverse(),
      recent,
      announcements: announcements.map((a) => ({
        _id: a._id, type: a.type, title: a.title,
        expiresAt: new Date(new Date(a.createdAt).getTime() + ANNOUNCEMENT_TTL_SECONDS * 1000).toISOString(),
      })),
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
