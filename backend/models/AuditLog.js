import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
  action: { type: String, required: true }, // login, login_failed, create, update, delete, export, settings
  entity: { type: String, default: '' },
  entityId: { type: String, default: '' },
  summary: { type: String, default: '', maxlength: 300 },
  ip: { type: String, default: '' },
  at: { type: Date, default: Date.now, index: { expireAfterSeconds: 60 * 60 * 24 * 180 } }, // keep 180 days
});

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditSchema);
export default AuditLog;

export async function audit(req, action, entity = '', entityId = '', summary = '') {
  try {
    await AuditLog.create({ action, entity, entityId: String(entityId || ''), summary: String(summary).slice(0, 300), ip: req.ip || '' });
  } catch (err) {
    console.error('audit failed:', err?.message);
  }
}
