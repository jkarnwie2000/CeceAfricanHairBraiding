import { Router } from 'express';
import * as c from '../controllers/authController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import * as s from '../validators/schemas.js';

const r = Router();

r.post('/register', authLimiter, validate(s.registerSchema), c.register);
r.post('/register-admin', authLimiter, validate(s.adminRegisterSchema), c.registerAdmin);
r.post('/login', authLimiter, validate(s.loginSchema), c.login);
r.post('/logout', c.logout);
r.post('/forgot-password', authLimiter, validate(s.forgotPasswordSchema), c.forgotPassword);
r.post('/reset-password', authLimiter, validate(s.resetPasswordSchema), c.resetPassword);
r.get('/me', requireAuth, c.me);
// Same as /me but returns { user: null } instead of 401 for anonymous visitors (keeps the browser console clean)
r.get('/session', optionalAuth, (req, res) => res.json({ user: req.user ? req.user.toSafeJSON() : null }));
r.patch('/me', requireAuth, validate(s.profileSchema), c.updateProfile);
r.post('/change-password', requireAuth, authLimiter, validate(s.changePasswordSchema), c.changePassword);

export default r;
