import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const url = process.env.DATABASE_URL?.replace(/^["']/, "").replace(/["']$/, "");
  if (!url) throw new Error("No URL");
  
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const users = [
    { email: "ops@cruxdoc.com", name: "Operations Team", role: "OPS" },
    { email: "admin@cruxdoc.com", name: "Super Administrator", role: "ADMIN" },
    { email: "vaild@cruxdoc.com", name: "Validation Team", role: "VALIDATOR" },
    { email: "valid@cruxdoc.com", name: "Validation Team (Corrected)", role: "VALIDATOR" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role as any, name: u.name },
      create: {
        email: u.email,
        name: u.name,
        role: u.role as any,
      },
    });
    console.log(`Upserted ${u.email} as ${u.role}`);
  }

  console.log("All requested users inserted successfully.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
