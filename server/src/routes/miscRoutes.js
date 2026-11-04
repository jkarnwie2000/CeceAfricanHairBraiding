import { Router } from 'express';
import * as c from '../controllers/miscController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { formLimiter } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import { imageUpload } from '../middleware/upload.js';
import { contactSchema, newsletterSchema } from '../validators/schemas.js';

const r = Router();

r.post('/contact', formLimiter, validate(contactSchema), c.submitContact);
r.post('/newsletter', formLimiter, validate(newsletterSchema), c.subscribe);
r.post('/uploads', requireAuth, requireAdmin, imageUpload.single('image'), c.uploadImage);

export default r;
