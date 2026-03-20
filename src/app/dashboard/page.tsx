import prisma from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  TrendingUp,
  FileText
} from "lucide-react";

export default async function DashboardPage() {
  const candidates = await prisma.candidate.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { documents: true } } },
  });

  const totalCandidates = candidates.length;
  const pendingCandidates = candidates.filter(c => c.status === "PENDING").length;
  const completedCandidates = candidates.filter(c => c.status === "READY_FOR_BATCH").length;

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

        <div className="glass-card rounded-3xl overflow-hidden">
          <Table>
            <TableHeader className="bg-accent/30">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest pl-8">Candidate</TableHead>
                <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Employer</TableHead>
                <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-center">Docs</TableHead>
                <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest pr-8 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.id} className="hover:bg-accent/30 transition-colors border-accent/20">
                  <TableCell className="py-6 pl-8">
                    <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm">{candidate.name || "N/A"}</span>
                        <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">{candidate.id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 font-medium text-sm text-muted-foreground">{candidate.employer || "N/A"}</TableCell>
                  <TableCell className="py-6 text-center">
                    <div className="flex justify-center">
                        <Badge 
                            variant="secondary"
                            className={`
                                font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider
                                ${candidate.status === "PENDING" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"}
                            `}
                        >
                          {candidate.status === "PENDING" ? "Pending" : "Verified"}
                        </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 text-center">
                    <span className="text-sm font-bold text-foreground">
                        {candidate._count.documents} <span className="text-muted-foreground font-normal">/ 4</span>
                    </span>
                  </TableCell>
                  <TableCell className="py-6 pr-8 text-right">
                    <Link href={`/dashboard/candidate/${candidate.id}`}>
                      <Button variant="ghost" size="sm" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all font-bold group">
                        Details
                        <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {candidates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center animate-in fade-in zoom-in duration-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <AlertCircle className="h-10 w-10 text-muted-foreground animate-bounce" />
                        <p className="text-muted-foreground font-bold tracking-tight">No submissions found yet.</p>
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
}
