import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import { env, PROJECT_ROOT } from './config/env.js';
import apiRoutes from './routes/index.js';
import { stripeWebhook } from './controllers/webhookController.js';
import { notFound, errorHandler } from './middleware/error.js';
import { apiLimiter, sanitizeBody } from './middleware/security.js';
import { UPLOAD_DIR } from './middleware/upload.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // correct client IPs behind Render/Railway/Heroku proxies (rate limiting)
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: ["'self'"],
          frameSrc: ["'self'", 'https://www.google.com'],
          formAction: ["'self'", 'https://checkout.stripe.com'],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(compression());
  if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));

  // ⚠ Stripe webhook needs the RAW body for signature verification — register before express.json()
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json', limit: '1mb' }), stripeWebhook);

  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());
  app.use(sanitizeBody);

  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true }));
  app.use('/api', apiLimiter, apiRoutes);
  app.use('/api', notFound);

  // Production: serve the built React app from the same origin
  const clientDist = path.join(PROJECT_ROOT, 'client', 'dist');
  if (env.isProd && fs.existsSync(clientDist)) {
    // Vite's hashed bundles never change → cache for a year; everything else for a week
    app.use('/assets', express.static(path.join(clientDist, 'assets'), { maxAge: '1y', immutable: true, index: false }));
    app.use(express.static(clientDist, { maxAge: '7d', index: false }));
    app.get('/{*splat}', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
