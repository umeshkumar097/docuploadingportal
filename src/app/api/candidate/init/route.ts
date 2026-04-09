import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json().catch(() => ({}));

    // Generate a fresh, empty candidate record for the public form session
    const candidate = await prisma.candidate.create({
      data: {
        status: "PENDING",
        currentStep: "STARTED",
        lastActiveAt: new Date(),
        clientId: clientId || null,
        phase: null, // Dynamic, will be set during lookup or form entry
      },
      select: {
        id: true,
        token: true,
      }
    });

    let clientConfig = null;
    if (clientId) {
      clientConfig = await prisma.client.findUnique({
        where: { id: clientId },
        select: { formConfig: true, examCenters: true }
      });
    }

    return NextResponse.json({ success: true, candidate, clientConfig });
  } catch (error) {
    console.error("Session init error:", error);
    return NextResponse.json({ error: "Failed to initialize anonymous session" }, { status: 500 });
  }
}
