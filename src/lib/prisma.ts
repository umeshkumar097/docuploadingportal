import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;
  console.log("Prisma singleton init: Standard PG Adapter (Prisma 7)");
  if (!url) {
    console.error("DATABASE_URL is missing!");
  }
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

let prisma: ReturnType<typeof prismaClientSingleton>;

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
