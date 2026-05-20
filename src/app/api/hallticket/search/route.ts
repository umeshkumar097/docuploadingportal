import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const number = searchParams.get("number")?.trim();

    if (!number) {
      return NextResponse.json({ error: "Hall ticket number is required" }, { status: 400 });
    }

    const hallTicket = await prisma.hallTicket.findUnique({
      where: { hallTicketNumber: number },
      include: {
        downloads: {
          orderBy: { downloadedAt: 'desc' },
          take: 1,
        }
      }
    });

    if (!hallTicket) {
      return NextResponse.json({ error: "Hall ticket not found. Please check your number." }, { status: 404 });
    }

    const lastDownloadedAt = hallTicket.downloads.length > 0 ? hallTicket.downloads[0].downloadedAt : null;

    // Get IP address (useful for logging)
    let ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }

    // Don't log the download here anymore. We will log it in a separate API call when the user actually clicks download.
    
    return NextResponse.json({
      success: true,
      filePath: hallTicket.filePath,
      lastDownloadedAt: lastDownloadedAt
    });
  } catch (error: any) {
    console.error("Hall ticket search error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
