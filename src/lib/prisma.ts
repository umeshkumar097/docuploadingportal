import "dotenv/config";
import * as PrismaClientModule from "@prisma/client";
import { Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

// Next.js 16 / Prisma 7 Singleton with Neon Serverless Adapter
const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;
  
  if (!url) {
    console.error("CRITICAL: DATABASE_URL is not defined in environment variables.");
  }

  try {
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaNeon(pool as any);
    
    // Use any-casting to bypass resolution issues during strict build phase
    const { PrismaClient } = PrismaClientModule as any;
    
    if (!PrismaClient) {
      throw new Error("PrismaClient missing in @prisma/client");
    }

    return new PrismaClient({ 
      adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  } catch (err) {
    console.error("FAILED to initialize Prisma with Neon Serverless Adapter:", err);
    throw err;
  }
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
