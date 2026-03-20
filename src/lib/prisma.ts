import "dotenv/config";
import { Prisma } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;
  console.log("Prisma singleton init: Standard PG Adapter (Prisma 7)");
  
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  
  // Use Prisma namespace to avoid named export issues on some build environments
  const Client = (Prisma as any).PrismaClient;
  return new Client({ adapter });
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
