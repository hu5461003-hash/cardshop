// Prisma Client singleton
// After running `npx prisma generate`, replace this file with:
//
//   import { PrismaClient } from "@prisma/client";
//   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
//   export const prisma = globalForPrisma.prisma ?? new PrismaClient();
//   if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
//   export default prisma;

// Stub class for build (remove after `npx prisma generate`)
class PrismaClientStub {
  // Add methods as needed
}

export const prisma = new PrismaClientStub() as any;
export default prisma;
