import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await auth();

    if (!session) {
      redirect("/login");
    }

    const role = session.user.role || "OPS";
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
  } catch (err: any) {
    console.error("DashboardLayout CRITICAL ERROR:", err);
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-6">
        <div className="glass-card p-10 rounded-[3rem] border-red-500/20 bg-red-500/5 text-center max-w-2xl w-full">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Security/Session Error</h1>
            <p className="text-zinc-400 mb-6">The portal encountered a problem verifying your session or connecting to the security layer.</p>
            <div className="bg-black/40 p-4 rounded-2xl text-left font-mono text-[10px] text-red-400/80 overflow-auto border border-red-500/10">
                <p className="font-bold mb-1 uppercase tracking-widest text-[8px]">Technical Log:</p>
                {err.message || String(err)}
            </div>
            <a href="/login" className="inline-block mt-8 px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors">
                Back to Login
            </a>
        </div>
      </div>
    );
  }
}
