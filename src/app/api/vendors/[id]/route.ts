import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, password, vendorName } = await req.json();
    const data: any = {};
    
    if (email) data.email = email;
    if (vendorName) {
      data.name = vendorName;
      data.vendorName = vendorName;
    }
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updatedVendor = await prisma.user.update({
      where: { id: params.id, role: "VENDOR" },
      data,
    });

    return NextResponse.json({ success: true, vendor: updatedVendor });
  } catch (error: any) {
    console.error("Vendor Update Error:", error);
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.delete({
      where: { id: params.id, role: "VENDOR" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Vendor Deletion Error:", error);
    return NextResponse.json({ error: "Failed to delete vendor" }, { status: 500 });
  }
}
