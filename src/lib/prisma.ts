import * as PrismaClientModule from "@prisma/client";
import { Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

let _prismaInstance: any = null;

const getPrisma = () => {
  if (_prismaInstance) return _prismaInstance;

  let url = process.env.DATABASE_URL;

  if (!url) {
    console.warn("WARNING: DATABASE_URL is not defined in environment variables. Database operations will fail if executed.");
  } else {
    // Aggressively sanitize accidentally pasted quotes in Vercel UI
    url = url.replace(/^["']/, "").replace(/["']$/, "");
    if (url.includes("channel_binding=require")) {
      url = url.replace(/channel_binding=require&?/, "").replace(/\?$/, "");
    }
  }

  try {
    const pool = new Pool({ connectionString: url });
    // @ts-ignore - bypassing type checking for adapter interface in dynamic environments
    const adapter = new PrismaNeon(pool);
    
    // @ts-ignore
    const { PrismaClient } = PrismaClientModule;
    
    if (!PrismaClient) {
      throw new Error("PrismaClient missing in @prisma/client");
    }

    _prismaInstance = new PrismaClient({ 
      adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

    return _prismaInstance;
  } catch (err: any) {
    console.error("FAILED to initialize Prisma with Neon Serverless Adapter:", err);
    throw err;
  }
};

const prisma = new Proxy({} as any, {
  get(target, prop) {
    if (prop === "then") return undefined; // Prevent Promise detection issues
    return getPrisma()[prop];
  }
});

if (process.env.NODE_ENV !== "production") {
  const g = global as any;
  if (!g.prismaInstance) {
    g.prismaInstance = _prismaInstance;
  }
}

export default prisma;

