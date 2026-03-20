import prisma from "../src/lib/prisma";

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log("Existing Users in Database:");
    console.log(JSON.stringify(users, null, 2));

    if (users.length === 0) {
      console.log("No users found. Creating a default admin...");
      const admin = await prisma.user.create({
        data: {
          email: "admin@example.com",
          name: "Admin User",
          role: "ADMIN",
        },
      });
      console.log("Created Admin:", admin);
    } else {
        console.log("Users already exist. No action taken.");
    }
  } catch (err) {
    console.error("Error accessing database:", err);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    if (prisma.$disconnect) {
        await prisma.$disconnect();
    }
  });
