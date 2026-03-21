import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, password, vendorName } = await req.json();

    if (!email || !password || !vendorName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const vendor = await prisma.user.create({
      data: {
        email,
        name: vendorName,
        role: "VENDOR",
        vendorName: vendorName,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ success: true, vendor: { id: vendor.id, email: vendor.email, vendorName: vendor.vendorName } });

  } catch (error: any) {
    console.error("Vendor Creation Error:", error);
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 });
  }
}
