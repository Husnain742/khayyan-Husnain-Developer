import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const JWT_OPTIONS = { algorithm: 'HS256', issuer: 'khayyan-portal', audience: 'khayyan-admin' };

/**
 * Guards every admin API. The single admin is identified ONLY by the ADMIN_EMAIL env var,
 * checked on every request, so there is no way to "become" admin from the database or the client.
 */
export function requireAdmin(req, res, next) {
  if (!env.jwtSecret || !env.adminEmail) {
    return res.status(503).json({ success: false, message: 'Server is not configured.' });
  }
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Login zaroori hai.' });
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret, {
      algorithms: [JWT_OPTIONS.algorithm],
      issuer: JWT_OPTIONS.issuer,
      audience: JWT_OPTIONS.audience,
    });
    if (payload.role !== 'admin' || String(payload.email || '').toLowerCase() !== env.adminEmail) {
      throw new Error('not admin');
    }
    req.admin = { email: env.adminEmail };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Session expire ho gaya, dobara login karein.' });
  }
}
