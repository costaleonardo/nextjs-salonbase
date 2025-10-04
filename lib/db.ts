import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

// Configure Neon to use WebSocket polyfill in Node.js
neonConfig.webSocketConstructor = ws

// Ensure DATABASE_URL or DATABASE_URL_POOLED is available
const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL or DATABASE_URL_POOLED is not defined in environment variables')
}

// Create connection pool for serverless
const pool = new Pool({ connectionString })

// Create Neon adapter
const adapter = new PrismaNeon(pool)

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error']
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
