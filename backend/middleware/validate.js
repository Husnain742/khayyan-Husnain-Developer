import mongoose from 'mongoose';

/** validate(schema, 'body' | 'query') -> puts the parsed (and trimmed/typed) result on req.valid[source] */
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error.issues[0]?.message || 'Invalid input',
      errors: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  req.valid = { ...(req.valid || {}), [source]: result.data };
  return next();
};

export const validObjectId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' });
  }
  return next();
};
