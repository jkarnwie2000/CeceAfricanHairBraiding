import { ContactMessage, Subscriber } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { notifyOwner } from '../services/emailService.js';
import { contactNotificationEmail } from '../emails/templates.js';
import { USE_BLOB, randomImageName } from '../middleware/upload.js';

export async function submitContact(req, res) {
  const { website, ...data } = req.body; // drop honeypot
  const msg = await ContactMessage.create(data);
  const mail = contactNotificationEmail(msg);
  notifyOwner(mail.subject, mail.html, mail.text);
  res.status(201).json({ message: "Thank you! We've received your message and will reply within one business day." });
}

export async function subscribe(req, res) {
  try {
    await Subscriber.create({ email: req.body.email });
  } catch (err) {
    if (err.code !== 11000) throw err; // already subscribed → treat as success
  }
  res.status(201).json({ message: "You're subscribed! Watch your inbox for styling tips and exclusive offers." });
}

export async function uploadImage(req, res) {
  if (!req.file) throw ApiError.badRequest('Please choose an image to upload');
  if (USE_BLOB) {
    // Vercel Blob: permanent public CDN URL
    const { put } = await import('@vercel/blob');
    const blob = await put(`uploads/${randomImageName(req.file.mimetype)}`, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype,
    });
    return res.status(201).json({ url: blob.url });
  }
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
}
