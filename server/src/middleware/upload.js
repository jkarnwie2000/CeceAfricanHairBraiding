import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import crypto from 'node:crypto';
import multer from 'multer';
import { SERVER_ROOT } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif' };

/**
 * Storage strategy:
 *  - BLOB_READ_WRITE_TOKEN set (Vercel Blob)  → files are kept in memory and uploaded to Blob by the controller
 *  - otherwise                                → saved to server/uploads (local dev / hosts with a persistent disk)
 * On Vercel without Blob the function filesystem is read-only, so we fall back to the OS temp dir (non-persistent).
 */
export const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

function resolveUploadDir() {
  const preferred = path.join(SERVER_ROOT, 'uploads');
  try {
    fs.mkdirSync(preferred, { recursive: true });
    fs.accessSync(preferred, fs.constants.W_OK);
    return preferred;
  } catch {
    const tmp = path.join(os.tmpdir(), 'cece-uploads');
    fs.mkdirSync(tmp, { recursive: true });
    return tmp;
  }
}
export const UPLOAD_DIR = resolveUploadDir();

export const randomImageName = (mimetype) => `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ALLOWED[mimetype]}`;

const storage = USE_BLOB
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
      // Random file names: never trust the user's original filename
      filename: (_req, file, cb) => cb(null, randomImageName(file.mimetype)),
    });

export const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED[file.mimetype]) cb(null, true);
    else cb(ApiError.badRequest('Only JPG, PNG, WebP or AVIF images are allowed'));
  },
});
