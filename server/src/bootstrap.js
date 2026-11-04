import { env, assertRuntimeEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';

export async function start({ mongoUri = env.mongoUri } = {}) {
  if (mongoUri) env.mongoUri = mongoUri;
  assertRuntimeEnv();
  await connectDB(env.mongoUri);
  const app = createApp();
  const server = await new Promise((resolve, reject) => {
    const s = app.listen(env.port, () => {
      console.log(`[server] API listening on port ${env.port} (${env.nodeEnv}) — ${env.serverUrl}`);
      resolve(s);
    });
    s.once('error', (err) => {
      if (err.code === 'EADDRINUSE') err.message = `Port ${env.port} is already in use. Stop the other process or set PORT in server/.env.`;
      reject(err);
    });
  });

  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received, shutting down…`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  return server;
}
