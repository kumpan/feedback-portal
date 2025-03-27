import { PrismaClient } from "@prisma/client";

// Define a single global instance of the Prisma client
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Initialize the Prisma client with proper error logging
export const prisma = global.prisma || 
  new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["query", "error", "warn"] 
      : ["error"],
  });

// In development mode, save the client instance to the global object
// to prevent multiple instances during hot reloading
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Re-export types from Prisma
export * from "@prisma/client";

export default prisma;
