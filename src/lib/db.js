import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

// Standard Prisma 5 initialization
export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;