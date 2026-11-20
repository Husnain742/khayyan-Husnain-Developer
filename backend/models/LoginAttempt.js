import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  ip: { type: String, required: true, index: true },
  at: { type: Date, default: Date.now, index: { expireAfterSeconds: 15 * 60 } },
});

export default mongoose.models.LoginAttempt || mongoose.model('LoginAttempt', schema);
