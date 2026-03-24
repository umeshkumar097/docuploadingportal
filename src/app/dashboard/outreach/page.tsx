import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { OutreachTable } from "@/components/outreach-table";
import { 
  Users, 
  TrendingUp,
  Building2,
  Database
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OutreachPage() {
  try {
    const session = await auth();
    const role = session?.user?.role || "OPS";

    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 glass-card rounded-[3rem]">
          <h2 className="text-2xl font-black text-foreground mb-2">Restricted Access</h2>
          <p className="text-muted-foreground">Only administrators can access Outreach Tracking.</p>
        </div>
      );
    }

    // 1. Fetch all Master Data
    const masterData = await prisma.masterEmployee.findMany({
      orderBy: { createdAt: "desc" }
    });

    // 2. Fetch all completed/partial candidates to exclude them
    const activeCandidates = await prisma.candidate.findMany({
      select: { employeeId: true }
    });
    
    const activeIds = new Set(activeCandidates.map((c: { employeeId: string | null }) => c.employeeId));
    
    // 3. Filter for those who HAVEN'T started anything (Outreach List)
    const outreachList = masterData.filter((m: { employeeId: string }) => !activeIds.has(m.employeeId));

    const stats = [
      { label: "Total Nominal", value: masterData.length, icon: Database, color: "text-blue-500", bg: "bg-blue-500/10" },
      { label: "Pending Outreach", value: outreachList.length, icon: TrendingUp, color: "text-pink-500", bg: "bg-pink-500/10" },
      { label: "Conversion Rate", value: `${Math.round(((masterData.length - outreachList.length) / (masterData.length || 1)) * 100)}%`, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    ];

    return (
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Outreach <span className="text-pink-500">Tracking</span>
            </h2>
            <p className="text-muted-foreground mt-2 text-lg">
              Contact candidates who haven't started their document upload process.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} w-fit mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-3xl font-black text-foreground">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
              <Building2 className="h-5 w-5 text-pink-500" />
              <h3 className="text-xl font-bold">Priority Calling List</h3>
          </div>
          <OutreachTable data={outreachList} />
        </div>
      </div>
    );
  } catch (err: any) {
    return (
      <div className="p-8 text-center text-red-500 glass-card rounded-3xl">
        <h2 className="text-xl font-bold mb-2">Error Loading Outreach</h2>
        <pre className="text-xs opacity-60">{err.message}</pre>
      </div>
    );
  }
}
