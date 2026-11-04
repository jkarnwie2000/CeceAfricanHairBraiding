import { Router } from 'express';
import * as c from '../controllers/checkoutController.js';
import { optionalAuth } from '../middleware/auth.js';
import { formLimiter } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import { cartQuoteSchema, checkoutSchema } from '../validators/schemas.js';

const r = Router();

r.post('/cart/quote', validate(cartQuoteSchema), c.quoteCart);
r.get('/checkout/config', c.stripeConfig);
r.post('/checkout/session', formLimiter, optionalAuth, validate(checkoutSchema), c.createCheckoutSession);
r.get('/checkout/session/:sessionId', c.getOrderBySession);
r.post('/checkout/cancel', formLimiter, c.cancelCheckout);

export default r;
