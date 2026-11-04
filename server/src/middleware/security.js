import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const skip = () => env.isTest;

/** Brute-force protection for login / password reset. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip,
  message: { message: 'Too many attempts. Please wait a few minutes and try again.' },
});

/** Protects public forms (booking, contact, newsletter) from spam. */
export const formLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip,
  message: { message: 'Too many submissions. Please try again later.' },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip,
});

/** Remove keys that start with "$" or contain "." from JSON bodies (MongoDB operator injection). */
function scrub(value) {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = scrub(v);
    }
    return out;
  }
  return value;
}

export function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = scrub(req.body);
  next();
}

/** Route-param guard: `/:id` must be a valid ObjectId. */
export function validObjectId(param = 'id') {
  return (req, _res, next) => {
    if (!mongoose.isValidObjectId(req.params[param])) throw ApiError.badRequest('Invalid id');
    next();
  };
}
