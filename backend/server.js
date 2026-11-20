import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env, configProblems } from './config/env.js';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import marhoomRoutes from './routes/marhoomein.js';
import announcementRoutes from './routes/announcements.js';
import settingsRoutes from './routes/settings.js';
import adminRoutes from './routes/admin.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // Vercel sits in front, so req.ip is the real client IP

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const devOrigins = env.isProd ? [] : ['http://localhost:5173', 'http://localhost:4173'];
const allowed = new Set([...env.allowedOrigins, ...devOrigins]);
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowed.has(origin)) return cb(null, true);
    return cb(null, false); // no CORS headers => browser blocks it
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
}));

app.use(express.json({ limit: '50kb' }));
app.use(rateLimit({ windowMs: 60 * 1000, limit: 180, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/', (req, res) => res.json({ ok: true, service: 'khayyan-portal-api' }));

// Refuse to run half-configured (fail closed instead of running without auth).
const problems = configProblems();
if (problems.length) {
  console.error('CONFIG ERROR:', problems.join('; '));
  app.use('/api', (req, res) => res.status(503).json({ success: false, message: 'Server is not configured.' }));
} else {
  app.use('/api', async (req, res, next) => {
    try {
      await connectDB();
      next();
    } catch (err) {
      console.error('DB connection failed:', err?.message);
      res.status(503).json({ success: false, message: 'Database abhi available nahi hai.' });
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/marhoomein', marhoomRoutes);
  app.use('/api/announcements', announcementRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/admin', adminRoutes);
}

app.use(notFound);
app.use(errorHandler);

if (!process.env.VERCEL) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`API running on http://localhost:${port}`));
}

export default app;
