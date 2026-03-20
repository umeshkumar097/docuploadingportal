import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { CandidateTable } from "@/components/candidate-table";
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  TrendingUp,
  FileText,
  Database
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  try {
    const candidates = await prisma.candidate.findMany({
      orderBy: { createdAt: "desc" },
      include: { 
        documents: true,
        _count: { select: { documents: true } } 
      },
    });

    const totalCandidates = candidates.length;
    const pendingCandidates = candidates.filter((c: any) => c.status === "PENDING").length;
    const completedCandidates = candidates.filter((c: any) => c.status === "READY_FOR_BATCH").length;

    const stats = [
      { label: "Total Candidates", value: totalCandidates, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
      { label: "Pending Verification", value: pendingCandidates, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
      { label: "Ready for Batch", value: completedCandidates, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
      { label: "Success Rate", value: "94%", icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-500/10" },
    ];

    return (
      <div className="space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Dashboard <span className="text-primary/80">Overview</span>
            </h2>
            <p className="text-muted-foreground mt-2 text-lg">
              Monitor and manage candidate document submissions in real-time.
            </p>
          </div>
          <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end mr-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">System Health</span>
                  <span className="text-xs font-medium text-emerald-500 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      All nodes operational
                  </span>
              </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat: any, i: number) => (
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

        {/* Table Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold">Recent Submissions</h3>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-1 font-bold">
                  View All <ChevronRight className="h-4 w-4" />
              </Button>
          </div>

          <CandidateTable candidates={candidates} />
        </div>
      </div>
    );
  } catch (err: any) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 glass-card rounded-[3rem] border-red-500/20 bg-red-500/5">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mb-6">
          <Database className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-foreground mb-2">Production Database Error</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          The dashboard failed to connect to your database. Please check your <code className="bg-muted px-1 rounded text-red-500">DATABASE_URL</code> in Vercel.
        </p>
        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 font-mono text-xs text-left max-w-2xl w-full border border-red-500/10 overflow-auto">
          <p className="text-red-500 font-bold mb-2 uppercase tracking-tighter">Environment Snapshot:</p>
          <div className="grid grid-cols-2 gap-2 mb-4 text-[10px]">
            <div className="bg-black/20 p-2 rounded-lg">
                <span className="text-muted-foreground">DATABASE_URL:</span>
                <span className={process.env.DATABASE_URL ? "text-emerald-500 ml-2" : "text-red-500 ml-2 animate-pulse"}>
                    {process.env.DATABASE_URL ? "DETECTED ✅" : "NOT FOUND ❌"}
                </span>
            </div>
            <div className="bg-black/20 p-2 rounded-lg">
                <span className="text-muted-foreground">AUTH_SECRET:</span>
                <span className={process.env.AUTH_SECRET ? "text-emerald-500 ml-2" : "text-amber-500 ml-2"}>
                    {process.env.AUTH_SECRET ? "DETECTED ✅" : "MISSING ⚠️"}
                </span>
            </div>
          </div>
          <p className="text-red-500 font-bold mb-1">Stack Trace:</p>
          <pre className="whitespace-pre-wrap opacity-60">{err.stack || String(err)}</pre>
        </div>
        <Button variant="outline" className="mt-8 rounded-xl font-bold border-red-500/20 hover:bg-red-500/10 text-red-600">
          Try Reloading
        </Button>
      </div>
    );
  }
}
