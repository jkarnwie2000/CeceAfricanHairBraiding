import { Router } from 'express';
import * as c from '../controllers/orderController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validObjectId } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import { orderStatusSchema, adminOrderQuerySchema } from '../validators/schemas.js';

const r = Router();

r.get('/mine', requireAuth, c.myOrders);
r.get('/admin/list', requireAuth, requireAdmin, validate(adminOrderQuerySchema, 'query'), c.adminListOrders);
r.patch('/admin/:id', requireAuth, requireAdmin, validObjectId(), validate(orderStatusSchema), c.adminUpdateOrder);
r.get('/:id', requireAuth, validObjectId(), c.getOrder);

export default r;
