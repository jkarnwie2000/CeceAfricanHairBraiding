import { start } from './bootstrap.js';

start().catch((err) => {
  console.error('[server] Failed to start:', err.message);
  process.exit(1);
});
