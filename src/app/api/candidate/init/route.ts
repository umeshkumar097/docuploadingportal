import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Generate a fresh, empty candidate record for the public form session
    const candidate = await prisma.candidate.create({
      data: {
        status: "PENDING",
        currentStep: "STARTED",
        lastActiveAt: new Date(),
      },
      select: {
        id: true,
        token: true,
      }
    });

    return NextResponse.json({ success: true, candidate });
  } catch (error) {
    console.error("Session init error:", error);
    return NextResponse.json({ error: "Failed to initialize anonymous session" }, { status: 500 });
  }
}
