/**
 * Vercel serverless entry point.
 * Every /api/* and /uploads/* request is rewritten here (see vercel.json); the static React build is served by Vercel's CDN.
 */
import { createApp } from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';
import { env } from '../server/src/config/env.js';

const app = createApp();

export default async function handler(req, res) {
  if (!env.mongoUri) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'The database is not configured yet (MONGODB_URI is missing).' }));
    return;
  }
  try {
    await connectDB(env.mongoUri);
  } catch (err) {
    console.error('[db] connection failed:', err.message);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'We are having trouble reaching the database. Please try again shortly.' }));
    return;
  }
  return app(req, res);
}
