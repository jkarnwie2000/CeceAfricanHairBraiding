/**
 * CLI: npm run seed                → insert missing categories, products, services + admin account
 *      npm run seed -- --demo      → also add demo customers, reviews, orders and appointments
 *      npm run seed -- --reset     → wipe & re-create the catalog first (development only)
 */
import { env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { seedDatabase } from './runSeed.js';

const args = process.argv.slice(2);

if (!env.mongoUri) {
  console.error('MONGODB_URI is not set. Copy server/.env.example to server/.env first.');
  process.exit(1);
}

try {
  await connectDB(env.mongoUri);
  await seedDatabase({ reset: args.includes('--reset'), demo: args.includes('--demo') });
  console.log(`\n✔ Seed complete. Admin login: ${env.admin.email} / (ADMIN_PASSWORD from .env)\n`);
} catch (err) {
  console.error('Seed failed:', err);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
