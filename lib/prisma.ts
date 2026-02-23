/**
 * This module initializes and exports the Prisma Client.
 * It uses a singleton pattern in development to prevent exhausting database connections
 * during Hot Module Replacement (HMR).
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Retrieve the database connection string from environment variables
const connectionString = `${process.env.DATABASE_URL}`;

// Initialize the PostgreSQL adapter for Prisma
const adapter = new PrismaPg({ connectionString });

// Define a global variable to store the Prisma instance in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Initialize the Prisma Client.
 * We reuse the existing instance from the global scope if it exists (in development),
 * otherwise we create a new one using the PostgreSQL adapter.
 */
const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

// If we're not in production, store the prisma instance in the global scope
// to ensure it persists across HMR cycles.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
