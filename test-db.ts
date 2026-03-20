import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_rKh8zv0weNaU@ep-purple-recipe-a5i0hocr.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
})

async function main() {
  const count = await prisma.user.count();
  console.log("SUCCESS! User count:", count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
