import "dotenv/config";
import * as PrismaClientModule from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Next.js 16 / Prisma 7 Singleton
const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;
  console.log("Prisma singleton init: Standard PG Adapter (Prisma 7)");
  
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  
  // Use any-casting to bypass resolution issues during strict build phase
  const { PrismaClient } = PrismaClientModule as any;
  if (!PrismaClient) {
    throw new Error("PrismaClient not found in @prisma/client module");
  }
  return new PrismaClient({ adapter });
};

let prisma: any;

if (process.env.NODE_ENV === "production") {
  prisma = prismaClientSingleton();
} else {
  const g = global as any;
  if (!g.prisma) {
    g.prisma = prismaClientSingleton();
  }
  prisma = g.prisma;
}

export default prisma;
