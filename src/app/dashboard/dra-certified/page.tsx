import prisma from "@/lib/prisma";
import { CandidateTable } from "@/components/candidate-table";
import { auth } from "@/auth";
import { 
  ClipboardCheck,
  FileText,
  Database,
  ShieldCheck,
  Search
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DraCertifiedPage() {
  try {
    const session = await auth();
    const role = session?.user?.role || "OPS";
    const vendorName = (session?.user as any)?.vendorName;

    // Filter ONLY for DRA Certified candidates
    const whereClause: any = {
      isDraCertified: true
    };
    
    if (role === "VENDOR") {
      if (vendorName) {
        whereClause.employer = { contains: vendorName, mode: "insensitive" };
      } else {
        whereClause.id = "force-empty-result-security";
      }
    }

    const candidates = await prisma.candidate.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: { 
        documents: true,
        _count: { select: { documents: true } } 
      },
    });

    const certifiedCount = candidates.filter((c: any) => 
        c.documents.some((d: any) => d.type === "DRA_CERTIFICATE")
    ).length;

    return (
      <div className="space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="p-4 rounded-3xl bg-primary/10 text-primary shadow-inner shadow-primary/5">
                <ClipboardCheck className="h-10 w-10" />
             </div>
             <div>
                <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl uppercase italic">
                  Certified <span className="text-primary/80">DRA</span>
                </h2>
                <p className="text-muted-foreground mt-1 text-lg font-medium">
                  Verified Debt Recovery Agents with valid certification uploads.
                </p>
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="h-20 w-20" />
                </div>
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Total Submissions</p>
                    <h3 className="text-5xl font-black text-foreground">{candidates.length}</h3>
                </div>
            </div>
            <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden border-emerald-500/20 bg-emerald-500/5 group">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-500 group-hover:scale-110 transition-transform text-emerald-500">
                    <FileText className="h-20 w-20" />
                </div>
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Active Certificates</p>
                    <h3 className="text-5xl font-black text-emerald-600">{certifiedCount}</h3>
                </div>
            </div>
            <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                    <Search className="h-20 w-20" />
                </div>
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Pending Verification</p>
                    <h3 className="text-5xl font-black text-foreground">{candidates.length - certifiedCount}</h3>
                </div>
            </div>
        </div>

        {/* Table Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
              <Database className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold uppercase tracking-tight">DRA Registry Workspace</h3>
          </div>

          <CandidateTable candidates={candidates} role={role} />
        </div>
      </div>
    );
  } catch (err: any) {
    return <div>Error loading DRA Certified data</div>;
  }
}
