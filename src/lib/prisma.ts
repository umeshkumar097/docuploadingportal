import "dotenv/config";
import * as PrismaClientModule from "@prisma/client";
import { Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

// Next.js 16 / Prisma 7 Singleton
const prismaClientSingleton = () => {
  let url = process.env.DATABASE_URL;

  if (url && url.includes("channel_binding=require")) {
    url = url.replace(/channel_binding=require&?/, "").replace(/\?$/, "");
  }

  // Use any-casting to bypass resolution issues during strict build phase
  const { PrismaClient } = PrismaClientModule as any;
  
  if (!PrismaClient) {
    throw new Error("PrismaClient missing in @prisma/client");
  }

  // Pass datasourceUrl dynamically at runtime to prevent Vercel environment capture bugs
  return new PrismaClient({ 
    datasourceUrl: url,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
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
