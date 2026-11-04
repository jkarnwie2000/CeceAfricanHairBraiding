import { Router } from 'express';
import * as c from '../controllers/serviceController.js';
import { optionalAuth, requireAuth, requireAdmin } from '../middleware/auth.js';
import { validObjectId } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import { serviceSchema, serviceUpdateSchema } from '../validators/schemas.js';

const r = Router();
const admin = [requireAuth, requireAdmin];

r.get('/', optionalAuth, c.listServices);
r.get('/:slug', c.getService);
r.post('/', ...admin, validate(serviceSchema), c.createService);
r.put('/:id', ...admin, validObjectId(), validate(serviceUpdateSchema), c.updateService);
r.delete('/:id', ...admin, validObjectId(), c.deleteService);

export default r;
