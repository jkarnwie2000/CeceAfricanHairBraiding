import { Router } from 'express';
import * as c from '../controllers/productController.js';
import * as rc from '../controllers/reviewController.js';
import { optionalAuth, requireAuth, requireAdmin } from '../middleware/auth.js';
import { validObjectId, formLimiter } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import * as s from '../validators/schemas.js';

const r = Router();
const admin = [requireAuth, requireAdmin];

r.get('/', optionalAuth, validate(s.productQuerySchema, 'query'), c.listProducts);
r.get('/price-range', c.priceRange);
r.get('/:slug', optionalAuth, c.getProduct);

r.get('/:id/reviews', validObjectId(), rc.listProductReviews);
r.post('/:id/reviews', requireAuth, formLimiter, validObjectId(), validate(s.reviewSchema), rc.createReview);

r.post('/', ...admin, validate(s.productSchema), c.createProduct);
r.put('/:id', ...admin, validObjectId(), validate(s.productUpdateSchema), c.updateProduct);
r.patch('/:id/inventory', ...admin, validObjectId(), validate(s.inventorySchema), c.updateInventory);
r.delete('/:id', ...admin, validObjectId(), c.deleteProduct);

export default r;
