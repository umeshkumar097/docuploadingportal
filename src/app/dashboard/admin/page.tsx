import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminManagementClient } from "./client";
import prisma from "@/lib/prisma";

export const metadata = {
  title: 'Organization Management | CruxDoc',
}

export default async function VendorsPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (!session || (role !== "SUPERADMIN" && role !== "ADMIN")) {
    redirect("/dashboard");
  }

  const vendors = await prisma.user.findMany({
    where: { role: "VENDOR" },
    select: { id: true, email: true, name: true, vendorName: true },
    orderBy: { email: "asc" }
  });

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Organization Management</h1>
        <p className="text-muted-foreground mt-2 font-medium">
          Manage your Vendors, Client Application Links, and project phases from a centralized dashboard.
        </p>
      </div>
      
      <AdminManagementClient initialVendors={vendors} initialClients={clients} role={role || "ADMIN"} />
    </div>
  );
}
