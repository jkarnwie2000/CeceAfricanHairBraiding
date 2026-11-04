import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

export const AUTH_COOKIE = 'cece_token';

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true, // not readable from JavaScript → protects against XSS token theft
    secure: env.isProd,
    sameSite: 'lax',
    maxAge: MAX_AGE_MS,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, { httpOnly: true, secure: env.isProd, sameSite: 'lax', path: '/' });
}

async function resolveUser(req) {
  const header = req.headers.authorization;
  const token = req.cookies?.[AUTH_COOKIE] || (header?.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
  const user = await User.findById(payload.sub);
  if (!user) return null;
  // Invalidate tokens issued before a password change
  if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime() - 1000) return null;
  return user;
}

/** Attaches req.user when a valid session exists, but never blocks the request. */
export async function optionalAuth(req, _res, next) {
  req.user = await resolveUser(req);
  next();
}

export async function requireAuth(req, _res, next) {
  req.user = await resolveUser(req);
  if (!req.user) throw ApiError.unauthorized();
  next();
}

/** Role-based access control: only administrators pass. Use after requireAuth. */
export function requireAdmin(req, _res, next) {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.role !== 'admin') throw ApiError.forbidden('Administrator access required');
  next();
}
