import cloudinary from '../config/cloudinary.js';
import { env } from '../config/env.js';

/** Upload an in-memory multer file to Cloudinary. Returns the secure URL. */
export function uploadBuffer(file, { folder, resourceType = 'image', transformation } = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType, transformation, unique_filename: true, use_filename: false },
      (err, result) => (err ? reject(err) : resolve(result.secure_url)),
    );
    stream.end(file.buffer);
  });
}

export const imageTransformation = [{ width: 1400, height: 1400, crop: 'limit', quality: 'auto', fetch_format: 'auto' }];

/** Works out the Cloudinary public_id + resource_type from a stored URL (only for OUR cloud). */
export function parseCloudinaryUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes(`res.cloudinary.com/${env.cloudinary.cloudName}/`)) return null;
  const m = /\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)$/.exec(url);
  if (!m) return null;
  const resourceType = m[1];
  const publicId = resourceType === 'raw' ? m[2] : m[2].replace(/\.[^/.]+$/, '');
  return { publicId: decodeURIComponent(publicId), resourceType };
}

/** Best-effort delete. Never throws. */
export async function removeMedia(url) {
  const info = parseCloudinaryUrl(url);
  if (!info) return;
  try {
    await cloudinary.uploader.destroy(info.publicId, { resource_type: info.resourceType, invalidate: true });
  } catch (err) {
    console.error('Cloudinary delete failed:', err?.message);
  }
}
