import express from 'express';
import { z } from 'zod';
import Marhoom from '../models/Marhoom.js';
import { getSettings, CONTACT_ICONS } from '../models/Settings.js';
import { requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { audit } from '../models/AuditLog.js';

const router = express.Router();

const shape = (s) => ({
  familiesCount: s.familiesCount,
  shajraCount: s.shajraCount,
  mapUrl: s.mapUrl,
  contacts: s.contacts,
});

// PUBLIC: everything the home page needs in one call
router.get('/', async (req, res) => {
  const [settings, totalRecords] = await Promise.all([getSettings(), Marhoom.estimatedDocumentCount()]);
  res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.json({ success: true, data: { ...shape(settings), totalRecords } });
});

const updateSchema = z.object({
  familiesCount: z.string().trim().min(1).max(12),
  shajraCount: z.string().trim().min(1).max(12),
  mapUrl: z.string().trim().max(500).refine((u) => u === '' || /^https:\/\/[^\s]+$/.test(u), 'Map link https:// se shuru hona chahiye').default(''),
  contacts: z.array(z.object({
    label: z.string().trim().min(1).max(40),
    phone: z.string().trim().regex(/^\+?[0-9][0-9 \-]{5,18}$/, 'Phone number sahi nahi hai'),
    icon: z.enum(CONTACT_ICONS).default('phone'),
  })).max(8),
});

router.put('/', requireAdmin, validate(updateSchema), async (req, res) => {
  const settings = await getSettings();
  settings.set(req.valid.body);
  await settings.save();
  await audit(req, 'settings', 'settings', settings._id, 'Updated portal settings');
  res.json({ success: true, data: shape(settings) });
});

export default router;
