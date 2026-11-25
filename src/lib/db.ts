import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

/**
 * Resolve the SQLite database URL so the app runs in any environment:
 * 1. Explicit DATABASE_URL env var (dev overrides, hosted databases).
 * 2. Committed seeded database at <cwd>/db/custom.db (repo root, standalone run).
 * 3. Parent directory fallback (running from .next/standalone with repo-root cwd).
 * 4. Last resort: <cwd>/db/custom.db even if missing, so Prisma's error names the path.
 */
function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  const candidates = [
    path.join(process.cwd(), 'db', 'custom.db'),
    path.join(process.cwd(), '..', 'db', 'custom.db'),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return `file:${candidate}`
  }
  return `file:${candidates[0]}`
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: resolveDatabaseUrl() },
    },
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
