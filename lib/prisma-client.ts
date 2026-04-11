import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

// Workaround for Supabase pgBouncer prepared statement cache issue
// See: https://github.com/prisma/prisma/issues/13899
const prismaConfig: any = {
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
};

// Add errorFormat for better error messages
prismaConfig.errorFormat = "pretty";

const prisma = global.prisma || new PrismaClient(prismaConfig);

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;
