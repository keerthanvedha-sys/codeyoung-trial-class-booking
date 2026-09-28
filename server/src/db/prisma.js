import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..', '..');
const rootDir = path.resolve(serverDir, '..');

// 1. Auto-discover or initialize environment configuration
const serverEnv = path.join(serverDir, '.env');
const rootEnv = path.join(rootDir, '.env');
const rootEnvExample = path.join(rootDir, '.env.example');

if (fs.existsSync(serverEnv)) {
  dotenv.config({ path: serverEnv });
} else if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else if (fs.existsSync(rootEnvExample)) {
  try {
    fs.copyFileSync(rootEnvExample, serverEnv);
    dotenv.config({ path: serverEnv });
    console.log('[Prisma] Auto-initialized server/.env from .env.example');
  } catch (e) {
    // Ignore if file system is read-only
  }
}

// 2. Fallback DATABASE_URL if undefined in environment
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./dev.db',
    },
  },
  log: process.env.NODE_ENV === 'test' ? [] : ['warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
