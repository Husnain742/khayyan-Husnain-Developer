import multer from 'multer';
import { HttpError } from '../utils/errors.js';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm'];

// Vercel serverless functions reject request bodies above ~4.5 MB, so stay below that.
const MAX_FILE_BYTES = 4 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 2, fields: 12, fieldSize: 10 * 1024 },
  fileFilter(req, file, cb) {
    if (file.fieldname === 'image' && IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);
    if (file.fieldname === 'audio' && AUDIO_TYPES.includes(file.mimetype)) return cb(null, true);
    return cb(new HttpError(400, file.fieldname === 'audio'
      ? 'Audio sirf MP3, M4A, WAV ya OGG hona chahiye.'
      : 'Tasveer sirf JPG, PNG ya WebP hona chahiye.'));
  },
});

export const imageUpload = upload.single('image');
export const mediaUpload = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'audio', maxCount: 1 }]);
