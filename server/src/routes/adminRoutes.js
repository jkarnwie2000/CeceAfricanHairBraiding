import { Router } from 'express';
import * as c from '../controllers/adminController.js';
import * as rc from '../controllers/reviewController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validObjectId } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import { paginationSchema, userRoleSchema } from '../validators/schemas.js';

const r = Router();

// Every admin route requires a logged-in administrator (role-based access control)
r.use(requireAuth, requireAdmin);

r.get('/stats', c.dashboardStats);
r.get('/customers', validate(paginationSchema, 'query'), c.listCustomers);
r.patch('/customers/:id/role', validObjectId(), validate(userRoleSchema), c.setUserRole);
r.get('/reviews', validate(paginationSchema, 'query'), rc.adminListReviews);
r.patch('/reviews/:id', validObjectId(), rc.setReviewApproval);
r.delete('/reviews/:id', validObjectId(), rc.deleteReview);
r.get('/messages', validate(paginationSchema, 'query'), c.listMessages);
r.patch('/messages/:id', validObjectId(), c.markMessageRead);
r.get('/subscribers', c.listSubscribers);

export default r;
