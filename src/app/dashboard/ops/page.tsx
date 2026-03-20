import prisma from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { 
  Users, 
  Clock, 
  FileCheck,
  AlertCircle,
  ChevronRight,
  Database
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OpsVerificationPage() {
  try {
    // Ops team only needs to see PENDING candidates
    const candidates = await prisma.candidate.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { documents: true } } },
    });

    const pendingCount = candidates.length;

    return (
      <div className="space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl flex items-center gap-4">
              Ops <span className="text-primary/80">Verification</span>
            </h2>
            <p className="text-muted-foreground mt-2 text-lg">
              Action required: Verify uploaded structural documents for {pendingCount} candidates.
            </p>
          </div>
          <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end mr-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Queue Status</span>
                  <span className="text-xs font-medium text-amber-500 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      {pendingCount} Pending
                  </span>
              </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold">Candidates Awaiting Ops Review</h3>
              </div>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden">
            <Table>
              <TableHeader className="bg-accent/30">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest pl-8">Candidate</TableHead>
                  <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                  <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-center">Docs Uploaded</TableHead>
                  <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest pr-8 text-right">Review Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate: any) => (
                  <TableRow key={candidate.id} className="hover:bg-accent/30 transition-colors border-accent/20">
                    <TableCell className="py-6 pl-8">
                      <div className="flex flex-col">
                          <span className="font-bold text-foreground text-sm">{candidate.name || "N/A"}</span>
                          <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">{candidate.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className="flex justify-center">
                          <Badge 
                              variant="secondary"
                              className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider"
                          >
                            Pending
                          </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <span className="text-sm font-bold text-foreground">
                          {candidate._count.documents} <span className="text-muted-foreground font-normal">/ 4</span>
                      </span>
                    </TableCell>
                    <TableCell className="py-6 pr-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                          <CopyButton token={candidate.token} />
                          <Link href={`/dashboard/candidate/${candidate.id}`}>
                          <Button variant="default" size="sm" className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-bold group bg-primary text-primary-foreground">
                              Verify Now
                              <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                          </Button>
                          </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {candidates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center animate-in fade-in zoom-in duration-500">
                      <div className="flex flex-col items-center justify-center space-y-3">
                          <CheckCircle2 className="h-10 w-10 text-emerald-500 animate-pulse" />
                          <p className="text-muted-foreground font-bold tracking-tight">Ops queue is completely empty. Great work!</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
      </div>
    );
  }
}
