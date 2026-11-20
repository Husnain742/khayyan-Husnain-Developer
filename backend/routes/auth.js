import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { JWT_OPTIONS, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import LoginAttempt from '../models/LoginAttempt.js';
import { audit } from '../models/AuditLog.js';

const router = express.Router();

// Compared against when the email is wrong, so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-the-password', 12);

const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.valid.body;
  const ip = req.ip || 'unknown';

  const fails = await LoginAttempt.countDocuments({ ip, at: { $gte: new Date(Date.now() - WINDOW_MS) } });
  if (fails >= MAX_FAILS) {
    return res.status(429).json({ success: false, message: 'Bohat zyada koshishein. 15 minute baad dobara try karein.' });
  }

  const emailMatches = email === env.adminEmail;
  const passwordMatches = await bcrypt.compare(password, emailMatches ? env.adminPasswordHash : DUMMY_HASH);

  if (!emailMatches || !passwordMatches) {
    await LoginAttempt.create({ ip });
    await audit(req, 'login_failed', 'auth', '', 'Failed admin login attempt');
    return res.status(401).json({ success: false, message: 'Email ya password ghalat hai.' });
  }

  await LoginAttempt.deleteMany({ ip });
  await audit(req, 'login', 'auth', '', 'Admin logged in');

  const token = jwt.sign({ role: 'admin', email: env.adminEmail }, env.jwtSecret, { ...JWT_OPTIONS, expiresIn: '8h', subject: 'admin' });
  return res.json({ success: true, token, expiresInSeconds: 8 * 3600, email: env.adminEmail });
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ success: true, email: req.admin.email });
});

export default router;
