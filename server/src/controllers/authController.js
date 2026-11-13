import crypto from 'node:crypto';
import { User } from '../models/index.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { randomToken, hashToken } from '../utils/tokens.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { sendEmail } from '../services/emailService.js';
import { passwordResetEmail, welcomeEmail } from '../emails/templates.js';

function issueSession(res, user, status = 200) {
  setAuthCookie(res, signToken(user));
  res.status(status).json({ user: user.toSafeJSON() });
}

export async function register(req, res) {
  const { name, email, password, phone } = req.body;
  if (await User.exists({ email })) throw ApiError.conflict('An account with this email already exists. Try logging in.');
  const user = await User.create({ name, email, password, phone, role: 'customer' });
  sendEmail({ to: user.email, ...welcomeEmail(user.name) });
  issueSession(res, user, 201);
}

/** Constant-time comparison so the invite code can't be guessed character by character. */
function inviteCodeMatches(given) {
  const expected = env.adminSignupCode;
  if (!expected || typeof given !== 'string') return false;
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

/**
 * Create an ADMINISTRATOR account. Requires the secret ADMIN_SIGNUP_CODE so the public
 * can never grant themselves admin access. Existing admins can also promote customers
 * from Admin → Customers.
 */
export async function registerAdmin(req, res) {
  if (!env.adminSignupCode) {
    throw ApiError.forbidden('Admin sign-up is turned off. Ask an existing administrator to grant you access.');
  }
  const { name, email, password, phone, inviteCode } = req.body;
  if (!inviteCodeMatches(inviteCode)) throw ApiError.forbidden('That admin invite code is not valid.');
  if (await User.exists({ email })) {
    throw ApiError.conflict('An account with this email already exists. Log in, or ask an administrator to grant it admin access.');
  }
  const user = await User.create({ name, email, password, phone, role: 'admin' });
  issueSession(res, user, 201);
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password (don't reveal which accounts exist)
  if (!user || !(await user.comparePassword(password))) throw ApiError.unauthorized('Incorrect email or password');
  issueSession(res, user);
}

export function logout(_req, res) {
  clearAuthCookie(res);
  res.json({ message: 'Logged out' });
}

export function me(req, res) {
  res.json({ user: req.user.toSafeJSON() });
}

export async function updateProfile(req, res) {
  const { name, phone, address } = req.body;
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (address) req.user.address = { ...req.user.address?.toObject?.(), ...address };
  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
}

export async function changePassword(req, res) {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) throw ApiError.badRequest('Current password is incorrect');
  user.password = req.body.newPassword;
  await user.save();
  issueSession(res, user); // refresh the cookie: older tokens are now invalid
}

export async function forgotPassword(req, res) {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const token = randomToken(32);
    user.resetPasswordTokenHash = hashToken(token);
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const url = `${env.clientUrl}/reset-password?token=${token}`;
    await sendEmail({ to: user.email, ...passwordResetEmail(user.name, url) });
  }
  // Always respond the same way to avoid account enumeration
  res.json({ message: 'If an account exists for that email, a reset link is on its way.' });
}

export async function resetPassword(req, res) {
  const user = await User.findOne({
    resetPasswordTokenHash: hashToken(req.body.token),
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordTokenHash +resetPasswordExpires');
  if (!user) throw ApiError.badRequest('This reset link is invalid or has expired. Please request a new one.');
  user.password = req.body.password;
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  issueSession(res, user);
}
