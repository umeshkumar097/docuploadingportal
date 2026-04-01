import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "ADD_FORM_ENABLED" }
    });
    
    // Default to true if not set
    return NextResponse.json({ 
      enabled: setting ? setting.value === "true" : true 
    });
  } catch (error) {
    return NextResponse.json({ enabled: true });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { enabled } = await req.json();
    
    await prisma.systemSetting.upsert({
      where: { key: "ADD_FORM_ENABLED" },
      update: { value: enabled ? "true" : "false" },
      create: { key: "ADD_FORM_ENABLED", value: enabled ? "true" : "false" }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
