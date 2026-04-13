import prisma from "../src/lib/prisma";

async function main() {
  const samples = await prisma.masterEmployee.findMany({
    take: 10,
    select: {
      employeeName: true,
      vendor: true
    }
  });
  console.log("MasterEmployee Samples:", JSON.stringify(samples, null, 2));

  const clients = await prisma.client.findMany({
    select: {
      name: true,
      slug: true
    }
  });
  console.log("Client Samples:", JSON.stringify(clients, null, 2));
}

main();
