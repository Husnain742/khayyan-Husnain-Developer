import express from 'express';
import { z } from 'zod';
import Marhoom, { WANDS } from '../models/Marhoom.js';
import { requireAdmin } from '../middleware/auth.js';
import { imageUpload } from '../middleware/upload.js';
import { validate, validObjectId } from '../middleware/validate.js';
import { audit } from '../models/AuditLog.js';
import { uploadBuffer, removeMedia, imageTransformation } from '../utils/media.js';
import { dayNameOf, escapeRegex, isValidISODate, todayPlusOneISO } from '../utils/dates.js';

const router = express.Router();

const person = {
  name: z.string().trim().min(2, 'Naam kam az kam 2 harf ka ho').max(100),
  fatherName: z.string().trim().min(2, 'Waldiyat ka naam kam az kam 2 harf ka ho').max(100),
  wand: z.enum(WANDS),
  dateOfDemise: z.string().trim()
    .refine(isValidISODate, 'Tareekh sahi nahi hai')
    .refine((d) => d <= todayPlusOneISO(), 'Tareekh mustaqbil ki nahi ho sakti'),
};
const createSchema = z.object({ ...person, confirmDuplicate: z.enum(['true', 'false']).optional() });
const updateSchema = z.object({ ...person, removeImage: z.enum(['true', 'false']).optional() });

const listSchema = z.object({
  q: z.string().trim().max(60).optional().default(''),
  wand: z.enum([...WANDS, 'All']).optional().default('All'),
  sort: z.enum(['newest', 'name', 'demise']).optional().default('newest'),
  noPhoto: z.enum(['true', 'false']).optional().default('false'),
  page: z.coerce.number().int().min(1).max(10000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(60).optional().default(24),
});

const SORTS = { newest: { createdAt: -1 }, name: { name: 1 }, demise: { dateOfDemise: -1 } };

// PUBLIC: list with search / filter / pagination
router.get('/', validate(listSchema, 'query'), async (req, res) => {
  const { q, wand, sort, noPhoto, page, limit } = req.valid.query;
  const filter = {};
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { fatherName: rx }, { wand: rx }];
  }
  if (wand !== 'All') filter.wand = wand;
  if (noPhoto === 'true') filter.$and = [{ $or: [{ imageName: '' }, { imageName: 'cover.jpg' }, { imageName: { $exists: false } }] }];

  const [data, total] = await Promise.all([
    Marhoom.find(filter).sort(SORTS[sort]).skip((page - 1) * limit).limit(limit).lean(),
    Marhoom.countDocuments(filter),
  ]);
  res.json({ success: true, data, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });
});

// PUBLIC: single record
router.get('/:id', validObjectId, async (req, res) => {
  const record = await Marhoom.findById(req.params.id).lean();
  if (!record) return res.status(404).json({ success: false, message: 'Record nahi mila.' });
  return res.json({ success: true, data: record });
});

// ADMIN: create
router.post('/', requireAdmin, imageUpload, validate(createSchema), async (req, res) => {
  const body = req.valid.body;

  if (body.confirmDuplicate !== 'true') {
    const dup = await Marhoom.findOne({
      name: new RegExp(`^${escapeRegex(body.name)}$`, 'i'),
      fatherName: new RegExp(`^${escapeRegex(body.fatherName)}$`, 'i'),
    }).lean();
    if (dup) {
      return res.status(409).json({ success: false, duplicate: true, message: 'Isi naam aur waldiyat ka record pehle se maujood hai.', existing: dup });
    }
  }

  const imageName = req.file ? await uploadBuffer(req.file, { folder: 'khayyan_portal/records', transformation: imageTransformation }) : '';
  const created = await Marhoom.create({
    name: body.name,
    fatherName: body.fatherName,
    wand: body.wand,
    dateOfDemise: body.dateOfDemise,
    dayOfWeek: dayNameOf(body.dateOfDemise),
    imageName,
  });
  await audit(req, 'create', 'marhoom', created._id, `Added ${created.name} s/o ${created.fatherName}`);
  res.status(201).json({ success: true, data: created });
});

// ADMIN: update
router.put('/:id', requireAdmin, validObjectId, imageUpload, validate(updateSchema), async (req, res) => {
  const existing = await Marhoom.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Record nahi mila.' });

  const body = req.valid.body;
  const oldImage = existing.imageName;
  existing.set({
    name: body.name,
    fatherName: body.fatherName,
    wand: body.wand,
    dateOfDemise: body.dateOfDemise,
    dayOfWeek: dayNameOf(body.dateOfDemise),
  });

  let replaced = false;
  if (req.file) {
    existing.imageName = await uploadBuffer(req.file, { folder: 'khayyan_portal/records', transformation: imageTransformation });
    replaced = true;
  } else if (body.removeImage === 'true') {
    existing.imageName = '';
    replaced = true;
  }

  await existing.save();
  if (replaced && oldImage) await removeMedia(oldImage);
  await audit(req, 'update', 'marhoom', existing._id, `Updated ${existing.name}`);
  res.json({ success: true, data: existing });
});

// ADMIN: delete
router.delete('/:id', requireAdmin, validObjectId, async (req, res) => {
  const removed = await Marhoom.findByIdAndDelete(req.params.id);
  if (!removed) return res.status(404).json({ success: false, message: 'Record nahi mila.' });
  if (removed.imageName) await removeMedia(removed.imageName);
  await audit(req, 'delete', 'marhoom', removed._id, `Deleted ${removed.name} s/o ${removed.fatherName}`);
  res.json({ success: true, message: 'Record delete ho gaya.' });
});

export default router;
