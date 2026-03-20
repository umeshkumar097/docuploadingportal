import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 15 minutes ago threshold
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Fetch active candidates who are not completely finalized yet
    const activeCandidates = await prisma.candidate.findMany({
      where: {
        status: "PENDING",
        lastActiveAt: {
          gte: fifteenMinutesAgo,
        },
      },
      include: {
        documents: true, // Need this to see exactly which documents are uploaded vs missing
      },
      orderBy: {
        lastActiveAt: "desc",
      },
    });

    return NextResponse.json({ success: true, candidates: activeCandidates });
  } catch (error) {
    console.error("Radar API error:", error);
    return NextResponse.json({ error: "Failed to fetch live radar data" }, { status: 500 });
  }
}
