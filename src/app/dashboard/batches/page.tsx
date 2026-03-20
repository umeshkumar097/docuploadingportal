import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { CandidateTable } from "@/components/candidate-table";
import { BatchActions } from "./batch-actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Package, Database } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  try {
    const session = await auth();
    const role = session?.user?.role || "OPS";

    // Fetch only READY candidates for the reports page
    const candidates = await prisma.candidate.findMany({
      where: { 
        status: "READY",
        name: { not: null }
      },
      orderBy: { updatedAt: "desc" },
      include: { 
        documents: true,
        _count: { select: { documents: true } } 
      },
    });

    return (
      <div className="space-y-10 pb-20">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-primary/10">
            <div>
              <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl flex items-center gap-4">
                System <span className="text-primary/80">Reports</span>
              </h2>
              <p className="text-muted-foreground mt-2 text-lg">
                Comprehensive overview of synchronized and ready-to-batch candidates.
              </p>
            </div>
            <BatchActions />
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-8 bg-primary rounded-full" />
                    <h3 className="text-2xl font-black">Completed Candidate Export</h3>
                </div>
             </div>
             {/* The user specifically wanted a table here with excel export */}
             <CandidateTable candidates={candidates} role={role} />
          </div>

        {/* Legacy Batch Handoff - only for Admins */}
        {role === "ADMIN" && (
          <Card className="rounded-[2.5rem] border-primary/10 bg-primary/5 mt-10">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Batch Handoff (ZIP)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-primary/20 rounded-[2rem] mx-6 mb-6">
              <Package className="h-16 w-16 text-primary/20 mb-4" />
              <h3 className="text-xl font-bold text-foreground">Prepare Final ZIP Archive</h3>
              <p className="text-sm text-muted-foreground max-w-md text-center mt-2">
                Generate a structured ZIP file containing individual folders for each ready candidate and their verified documents.
              </p>
              <a href="/api/export-zip">
                <Button size="lg" variant="default" className="mt-8 rounded-2xl px-10 h-14 font-black shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground group">
                  <Download className="mr-2 h-5 w-5 group-hover:translate-y-1 transition-transform" />
                  Download Final ZIP Bundle
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
        <h2 className="text-3xl font-black text-foreground mb-2">Production Database Error</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          The reports page failed to load. This may be due to a database connection issue or a missing configuration.
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
      </div>
    );
  }
}

// I'll need to update the imports and maybe move BatchActions.
