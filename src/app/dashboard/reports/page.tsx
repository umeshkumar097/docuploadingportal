import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { CandidateTable } from "@/components/candidate-table";
import { BatchActions } from "./batch-actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Package, Database, Activity, CheckCircle2, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  try {
    const session = await auth();
    const role = session?.user?.role || "OPS";
    const vendorName = (session?.user as any)?.vendorName;

    const baseWhereClause: any = { name: { not: null } };
    
    if (role === "VENDOR") {
      if (vendorName) {
        const vName = vendorName.toUpperCase();
        const baseSearch = vendorName.substring(0, 4); 

        baseWhereClause.OR = [
          { employer: { contains: vendorName, mode: "insensitive" } },
          { employer: { contains: baseSearch, mode: "insensitive" } }
        ];

        if (vName.includes("TVS")) {
          baseWhereClause.OR.push({ employer: { contains: "TVS", mode: "insensitive" } });
        }
        if (vName.includes("BOB") || vName.includes("BARODA")) {
          baseWhereClause.OR.push({ employer: { contains: "BOB", mode: "insensitive" } });
          baseWhereClause.OR.push({ employer: { contains: "Baroda", mode: "insensitive" } });
        }
      } else {
        baseWhereClause.id = "force-empty-result-security";
      }
    }

    // Fetch all statuses for the status breakdown
    const statusCounts = await prisma.candidate.groupBy({
      by: ['status'],
      _count: { _all: true },
      where: baseWhereClause
    });

    const getCount = (status: string) => statusCounts.find((s: any) => s.status === status)?._count._all || 0;

    // Fetch only READY candidates for the reports table
    const candidates = await prisma.candidate.findMany({
      where: {
        ...baseWhereClause,
        status: "READY"
      },
      orderBy: { updatedAt: "desc" },
      include: { 
        documents: true,
        _count: { select: { documents: true } } 
      },
    });

    return (
      <div className="space-y-10 pb-20">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-primary/10">
            <div>
              <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl flex items-center gap-4">
                System <span className="text-primary/80">Reports</span>
              </h2>
              <p className="text-muted-foreground mt-2 text-lg">
                Comprehensive overview of synchronized and ready-to-batch candidates.
              </p>
            </div>
            <BatchActions role={role} />
          </div>

          {/* Status Synchronization Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="rounded-[2rem] border-primary/5 bg-primary/5">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pending Verification</p>
                        <p className="text-2xl font-black text-foreground">{getCount("PENDING")}</p>
                    </div>
                </CardContent>
              </Card>
              <Card className="rounded-[2rem] border-primary/5 bg-primary/5">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Activity className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Awaiting Batching</p>
                        <p className="text-2xl font-black text-foreground">{getCount("VALIDATED")}</p>
                    </div>
                </CardContent>
              </Card>
              <Card className="rounded-[2rem] border-primary/5 bg-primary/5">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Included in Reports</p>
                        <p className="text-2xl font-black text-foreground">{getCount("READY")}</p>
                    </div>
                </CardContent>
              </Card>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-8 bg-primary rounded-full" />
                    <h3 className="text-2xl font-black">Sync-Ready Candidates</h3>
                </div>
             </div>
             {/* Main Data Table */}
             <CandidateTable candidates={candidates} role={role} />
          </div>

        {/* Legacy Batch Handoff - only for Admins */}
        {role === "ADMIN" && (
          <Card className="rounded-[2.5rem] border-primary/10 bg-primary/5 mt-10">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Cloud Archive Export (ZIP)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-primary/20 rounded-[2rem] mx-6 mb-6">
              <Package className="h-16 w-16 text-primary/20 mb-4" />
              <h3 className="text-xl font-bold text-foreground">Prepare Production Handoff</h3>
              <p className="text-sm text-muted-foreground max-w-md text-center mt-2">
                Download a consolidated ZIP archive containing all candidates with status 'READY' and their verified 10MB-optimized attachments.
              </p>
              <a href="/api/export-zip">
                <Button size="lg" variant="default" className="mt-8 rounded-2xl px-10 h-14 font-black shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground group">
                  <Download className="mr-2 h-5 w-5 group-hover:translate-y-1 transition-transform" />
                  Generate Multi-Candidate ZIP
                </Button>
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    );
  } catch (err: any) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 glass-card rounded-[3rem] border-red-500/20 bg-red-500/5">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mb-6">
          <Database className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-foreground mb-2">Integration Error</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          The reporting system encountered an error synchronization with our data layer.
        </p>
        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 font-mono text-xs text-left max-w-2xl w-full border border-red-500/10 overflow-auto">
          <pre className="whitespace-pre-wrap opacity-60 font-bold text-red-500">{err.message || String(err)}</pre>
          <pre className="whitespace-pre-wrap opacity-40 mt-4">{err.stack}</pre>
        </div>
      </div>
    );
  }
}
