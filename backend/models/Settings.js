import mongoose from 'mongoose';

export const CONTACT_ICONS = ['phone', 'mosque', 'ambulance', 'grave', 'person'];

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    familiesCount: { type: String, default: '120+', maxlength: 12 },
    shajraCount: { type: String, default: '50+', maxlength: 12 },
    mapUrl: { type: String, default: '', maxlength: 500 },
    contacts: {
      type: [
        {
          _id: false,
          label: { type: String, required: true, trim: true, maxlength: 40 },
          phone: { type: String, required: true, trim: true, maxlength: 20 },
          icon: { type: String, enum: CONTACT_ICONS, default: 'phone' },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

/** Singleton getter. First run imports the old "stats" counters if they exist. */
export async function getSettings() {
  let doc = await Settings.findOne({ key: 'main' });
  if (doc) return doc;
  const seed = {};
  try {
    const legacy = await mongoose.connection.collection('stats').findOne({});
    if (legacy?.familiesCount) seed.familiesCount = String(legacy.familiesCount).slice(0, 12);
    if (legacy?.shajraCount) seed.shajraCount = String(legacy.shajraCount).slice(0, 12);
  } catch { /* no legacy data */ }
  try {
    doc = await Settings.create({ key: 'main', ...seed });
  } catch {
    doc = await Settings.findOne({ key: 'main' }); // created concurrently
  }
  return doc;
}

export default Settings;
