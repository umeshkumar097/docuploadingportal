import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const token = resolvedParams.token;
    
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const body = await req.json();
    const { step } = body;

    // Validate if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { token },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    // Only update active status if not completed
    if (candidate.status === "READY") {
      return NextResponse.json({ message: "Candidate already completed" }, { status: 200 });
    }

    const updateData: any = {
      lastActiveAt: new Date(),
    };

    if (step) {
      updateData.currentStep = step;
    }

    await prisma.candidate.update({
      where: { token },
      data: updateData,
    });

    return NextResponse.json({ success: true, timestamp: updateData.lastActiveAt });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
