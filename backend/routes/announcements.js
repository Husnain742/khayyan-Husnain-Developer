import express from 'express';
import { z } from 'zod';
import Announcement, { ANNOUNCEMENT_TYPES, ANNOUNCEMENT_TTL_SECONDS } from '../models/Announcement.js';
import { requireAdmin } from '../middleware/auth.js';
import { mediaUpload } from '../middleware/upload.js';
import { validate, validObjectId } from '../middleware/validate.js';
import { audit } from '../models/AuditLog.js';
import { uploadBuffer, removeMedia, imageTransformation } from '../utils/media.js';
import { isValidISODate } from '../utils/dates.js';

const router = express.Router();

const fields = {
  type: z.enum(ANNOUNCEMENT_TYPES),
  title: z.string().trim().min(3, 'Heading kam az kam 3 harf ki ho').max(160),
  date: z.string().trim().refine(isValidISODate, 'Tareekh sahi nahi hai'),
  details: z.string().trim().min(3, 'Tafseelat likhein').max(2000),
};
const createSchema = z.object(fields);
const updateSchema = z.object({
  ...fields,
  removeImage: z.enum(['true', 'false']).optional(),
  removeAudio: z.enum(['true', 'false']).optional(),
});

const withExpiry = (doc) => ({
  ...doc,
  expiresAt: new Date(new Date(doc.createdAt).getTime() + ANNOUNCEMENT_TTL_SECONDS * 1000).toISOString(),
});

// PUBLIC
router.get('/', async (req, res) => {
  const items = await Announcement.find().sort({ createdAt: -1 }).limit(100).lean();
  res.json({ success: true, data: items.map(withExpiry) });
});

// ADMIN
router.post('/', requireAdmin, mediaUpload, validate(createSchema), async (req, res) => {
  const body = req.valid.body;
  const imageFile = req.files?.image?.[0];
  const audioFile = req.files?.audio?.[0];

  const [image, audio] = await Promise.all([
    imageFile ? uploadBuffer(imageFile, { folder: 'khayyan_portal/announcements', transformation: imageTransformation }) : '',
    audioFile ? uploadBuffer(audioFile, { folder: 'khayyan_portal/announcements', resourceType: 'video' }) : '',
  ]);

  const created = await Announcement.create({ ...body, image, audio });
  await audit(req, 'create', 'announcement', created._id, `Published: ${created.title}`);
  res.status(201).json({ success: true, data: withExpiry(created.toObject()) });
});

router.put('/:id', requireAdmin, validObjectId, mediaUpload, validate(updateSchema), async (req, res) => {
  const existing = await Announcement.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Elaan nahi mila.' });

  const body = req.valid.body;
  const imageFile = req.files?.image?.[0];
  const audioFile = req.files?.audio?.[0];
  const toDelete = [];

  existing.set({ type: body.type, title: body.title, date: body.date, details: body.details });

  if (imageFile) {
    toDelete.push(existing.image);
    existing.image = await uploadBuffer(imageFile, { folder: 'khayyan_portal/announcements', transformation: imageTransformation });
  } else if (body.removeImage === 'true') {
    toDelete.push(existing.image);
    existing.image = '';
  }
  if (audioFile) {
    toDelete.push(existing.audio);
    existing.audio = await uploadBuffer(audioFile, { folder: 'khayyan_portal/announcements', resourceType: 'video' });
  } else if (body.removeAudio === 'true') {
    toDelete.push(existing.audio);
    existing.audio = '';
  }

  await existing.save();
  await Promise.all(toDelete.filter(Boolean).map(removeMedia));
  await audit(req, 'update', 'announcement', existing._id, `Edited: ${existing.title}`);
  res.json({ success: true, data: withExpiry(existing.toObject()) });
});

router.delete('/:id', requireAdmin, validObjectId, async (req, res) => {
  const removed = await Announcement.findByIdAndDelete(req.params.id);
  if (!removed) return res.status(404).json({ success: false, message: 'Elaan nahi mila.' });
  await Promise.all([removed.image, removed.audio].filter(Boolean).map(removeMedia));
  await audit(req, 'delete', 'announcement', removed._id, `Deleted: ${removed.title}`);
  res.json({ success: true, message: 'Elaan delete ho gaya.' });
});

export default router;
