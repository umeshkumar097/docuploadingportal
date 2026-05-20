import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPERADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logs = await prisma.emailLog.findMany({
      orderBy: { sentAt: "desc" },
      include: {
        candidate: {
          select: { name: true, employeeId: true }
        }
      },
      take: 100 // Limit to recent 100 for performance
    });

    const total = await prisma.emailLog.count();
    const sent = await prisma.emailLog.count({ where: { status: "SENT" } });
    const failed = await prisma.emailLog.count({ where: { status: "FAILED" } });

    return NextResponse.json({
      logs,
      stats: { total, sent, failed }
    });
  } catch (error: any) {
    console.error("Fetch email logs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
