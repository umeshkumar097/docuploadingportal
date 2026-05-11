import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function check() {
    console.log("--- STARTING DATABASE CHECK ---");
    try {
        const count = await prisma.masterEmployee.count();
        console.log("Total Master Employees:", count);

        const samples = await prisma.masterEmployee.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' }
        });

        console.log("Latest 10 entries:");
        samples.forEach(s => {
            console.log(`- ID: [${s.employeeId}], Name: ${s.employeeName}, Client: ${s.clientId}, Mobile: ${s.personalMobileNo}`);
        });

        const specific = await prisma.masterEmployee.findFirst({
            where: {
                employeeId: { contains: '073367', mode: 'insensitive' }
            }
        });

        if (specific) {
            console.log("FOUND SPECIFIC ID B073367:", specific);
        } else {
            console.log("COULD NOT FIND ID B073367 IN DATABASE");
        }
    } catch (e) {
        console.error("DB Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
