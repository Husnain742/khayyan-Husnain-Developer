import mongoose from 'mongoose';

export const WANDS = ['Landa Wali Wand', 'Charda Wali Wand', 'Daken Wali Wand', 'Perbat Wali Wand'];

const marhoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    fatherName: { type: String, required: true, trim: true, maxlength: 100 },
    wand: { type: String, required: true, enum: WANDS },
    dateOfDemise: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    dayOfWeek: { type: String, default: '' },
    imageName: { type: String, default: '' }, // Cloudinary URL (field name kept for existing data)
  },
  { timestamps: true },
);

marhoomSchema.index({ name: 1 });
marhoomSchema.index({ createdAt: -1 });
marhoomSchema.index({ wand: 1, dateOfDemise: -1 });

export default mongoose.models.Marhoom || mongoose.model('Marhoom', marhoomSchema);
