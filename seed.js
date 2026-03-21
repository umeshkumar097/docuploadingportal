const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const email = "aiclex";
  const password = await bcrypt.hash("Aiclex@123", 10);
  
  await prisma.user.upsert({
    where: { email },
    update: { password, role: "ADMIN", name: "Godeye Super Admin" },
    create: { email, password, role: "ADMIN", name: "Godeye Super Admin" }
  });
  
  console.log("Seeded Super Admin: aiclex");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
