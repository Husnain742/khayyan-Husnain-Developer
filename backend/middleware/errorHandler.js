import multer from 'multer';
import { ZodError } from 'zod';

export function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File 4MB se choti honi chahiye.' : 'File upload mein masla aaya.';
    return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ success: false, message });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ success: false, message: err.issues[0]?.message || 'Invalid input' });
  }
  if (err?.name === 'ValidationError' || err?.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid data.' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request bohat bari hai.' });
  }
  if (err?.status && err.status < 500) {
    return res.status(err.status).json({ success: false, message: err.message });
  }
  // Never leak internals (DB messages, stack traces) to the client.
  console.error('Unhandled error:', err);
  return res.status(500).json({ success: false, message: 'Server par masla aaya. Thori der baad try karein.' });
}
