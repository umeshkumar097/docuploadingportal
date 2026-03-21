import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { VendorManagementClient } from "./client";
import prisma from "@/lib/prisma";

export const metadata = {
  title: 'Vendor Management | CruxDoc',
}

export default async function VendorsPage() {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch existing vendors
  const vendors = await prisma.user.findMany({
    where: { role: "VENDOR" },
    select: { id: true, email: true, name: true, vendorName: true },
    orderBy: { email: "asc" }
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Multi-Tenant Vendors</h1>
        <p className="text-muted-foreground mt-2 font-medium">
          Create and manage dedicated portals for your partner companies. Vendors can log in to view only their specific candidates and upload scoped Master Data.
        </p>
      </div>
      
      <VendorManagementClient initialVendors={vendors} />
    </div>
  );
}
