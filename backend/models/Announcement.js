import mongoose from 'mongoose';

export const ANNOUNCEMENT_TYPES = ['Vafat', 'Soyem / Qul', 'Elaan'];

const announcementSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ANNOUNCEMENT_TYPES },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}/ },
    details: { type: String, required: true, trim: true, maxlength: 2000 },
    image: { type: String, default: '' },
    audio: { type: String, default: '' },
  },
  { timestamps: true },
);

// Same index as before (announcements auto-expire 24h after creation). Keep options identical
// so MongoDB does not complain about a conflicting index.
announcementSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export const ANNOUNCEMENT_TTL_SECONDS = 86400;

export default mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
