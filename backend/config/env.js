import dotenv from 'dotenv';
dotenv.config();

const get = (key) => (process.env[key] || '').trim();

export const env = {
  mongoUri: get('MONGO_URI'),
  jwtSecret: get('JWT_SECRET'),
  adminEmail: get('ADMIN_EMAIL').toLowerCase(),
  adminPasswordHash: get('ADMIN_PASSWORD_HASH'),
  allowedOrigins: get('ALLOWED_ORIGINS').split(',').map((s) => s.trim()).filter(Boolean),
  cloudinary: {
    cloudName: get('CLOUDINARY_CLOUD_NAME'),
    apiKey: get('CLOUDINARY_API_KEY'),
    apiSecret: get('CLOUDINARY_API_SECRET'),
  },
  isProd: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
};

/** Returns a list of human-readable problems. Empty list = config is OK. */
export function configProblems() {
  const problems = [];
  if (!env.mongoUri) problems.push('MONGO_URI missing');
  if (!env.adminEmail) problems.push('ADMIN_EMAIL missing');
  if (!/^\$2[aby]\$\d{2}\$/.test(env.adminPasswordHash)) problems.push('ADMIN_PASSWORD_HASH missing or not a bcrypt hash');
  if (env.jwtSecret.length < 32) problems.push('JWT_SECRET missing or shorter than 32 chars');
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) problems.push('CLOUDINARY_* missing');
  if (env.isProd && env.allowedOrigins.length === 0) problems.push('ALLOWED_ORIGINS missing');
  return problems;
}
