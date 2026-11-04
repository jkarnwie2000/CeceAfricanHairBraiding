import { Router } from 'express';
import * as c from '../controllers/categoryController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validObjectId } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import { categorySchema } from '../validators/schemas.js';

const r = Router();
const admin = [requireAuth, requireAdmin];

r.get('/', c.listCategories);
r.post('/', ...admin, validate(categorySchema), c.createCategory);
r.put('/:id', ...admin, validObjectId(), validate(categorySchema.partial()), c.updateCategory);
r.delete('/:id', ...admin, validObjectId(), c.deleteCategory);

export default r;
