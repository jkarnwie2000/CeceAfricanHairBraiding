/**
 * Zero-install development mode: starts an in-memory MongoDB, seeds it with the catalog + demo data,
 * then boots the API. Data is lost when the process stops. Use a real MONGODB_URI for anything persistent.
 *
 *   npm run dev:memory   (from /server)   or   npm run dev:memory   (from the project root)
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import { start } from './bootstrap.js';
import { seedDatabase } from './seed/runSeed.js';
import { env } from './config/env.js';

console.log('[dev:memory] Starting in-memory MongoDB (first run downloads ~100 MB)…');
const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri('cece');

await start({ mongoUri: uri });
await seedDatabase({ demo: true });
console.log(`\n[dev:memory] Ready. Admin: ${env.admin.email} / ${env.admin.password}  ·  Demo customer: amara@example.com / Customer123!\n`);

const stop = async () => {
  await mongod.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
