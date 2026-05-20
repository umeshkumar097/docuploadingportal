import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { number } = body;

    if (!number) {
      return NextResponse.json({ error: "Hall ticket number is required" }, { status: 400 });
    }

    const hallTicket = await prisma.hallTicket.findUnique({
      where: { hallTicketNumber: number }
    });

    if (!hallTicket) {
      return NextResponse.json({ error: "Hall ticket not found" }, { status: 404 });
    }

    let ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }

    await prisma.hallTicketDownloadLog.create({
      data: {
        hallTicketId: hallTicket.id,
        ipAddress: ip,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Hall ticket log error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
