import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';
import prisma from './db/prisma.js';
import { seedMentors } from '../prisma/seed.js';
import { CONFIG } from './config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..');

const PORT = CONFIG.PORT;

async function ensureDatabaseReady() {
  try {
    const count = await prisma.mentor.count();
    if (count === 0) {
      console.log('[Startup] Database is empty. Seeding 10 mentors...');
      await seedMentors();
    } else {
      console.log(`[Startup] Database ready with ${count} active mentors.`);
    }
  } catch (error) {
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.log('[Startup] Database tables not initialized. Running prisma db push...');
      try {
        execSync('npx prisma db push --skip-generate', {
          cwd: serverDir,
          stdio: 'inherit',
          env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db' },
        });
        console.log('[Startup] Schema pushed successfully. Seeding mentors...');
        await seedMentors();
      } catch (pushErr) {
        console.error('[Startup] Failed to auto-initialize schema:', pushErr.message);
      }
    } else {
      console.warn('[Startup] Database status note:', error.message);
    }
  }
}

async function startServer() {
  await ensureDatabaseReady();

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`Codeyoung Trial Booking Server running on port ${PORT}`);
    console.log(`API Base: http://localhost:${PORT}/api`);
    console.log(`Health:   http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

startServer();
