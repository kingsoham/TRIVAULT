import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { storageManager } from './storage/storageAdapter.js';
import { User } from './models/User.js';
import { seedDatabase } from './scripts/seed.js';

async function startServer() {
  await connectDB();

  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Startup] No users found. Auto-seeding database with demo credentials...');
      await seedDatabase(false);
    }
  } catch (seedErr: any) {
    console.warn('[Startup] Auto-seed check warning:', seedErr.message);
  }
  
  try {
    const storage = await storageManager.getProvider();
    console.log(`[Storage] Initialized storage provider mode: ${storage.getMode().toUpperCase()}`);
  } catch (err: any) {
    console.warn(`[Storage] Warning initializing storage provider: ${err.message}`);
  }

  const port = parseInt(env.PORT, 10) || 5000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`  TriVault Backend Server running on port ${port}`);
    console.log(`  Health Check: http://0.0.0.0:${port}/health`);
    console.log(`  API Base URL: http://0.0.0.0:${port}/api/v1`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('[Server Error] Fatal startup error:', err);
  process.exit(1);
});
