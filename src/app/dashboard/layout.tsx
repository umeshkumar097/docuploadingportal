import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  const email = session.user.email || "Admin User";

  return (
    <div className="flex flex-col lg:flex-row h-screen premium-gradient">
      <DashboardNav email={email} role={role} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-8 md:px-8 md:py-10">
        <div className="max-w-7xl mx-auto animate-in fade-in duration-700">
          {children}
        </div>
      </main>
    </div>
  );
}
