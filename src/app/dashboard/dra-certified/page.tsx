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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        const vName = vendorName.toUpperCase();
        const baseSearch = vendorName.substring(0, 4); 

        whereClause.OR = [
          { employer: { contains: vendorName, mode: "insensitive" } },
          { employer: { contains: baseSearch, mode: "insensitive" } }
        ];

        if (vName.includes("TVS")) {
          whereClause.OR.push({ employer: { contains: "TVS", mode: "insensitive" } });
        }
        if (vName.includes("BOB") || vName.includes("BARODA")) {
          whereClause.OR.push({ employer: { contains: "BOB", mode: "insensitive" } });
          whereClause.OR.push({ employer: { contains: "Baroda", mode: "insensitive" } });
        }
      } else {
        whereClause.id = "force-empty-result-security";
      }
    }

    const candidates = await prisma.candidate.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: { 
        client: { select: { name: true } },
        documents: true,
        _count: { select: { documents: true } } 
      },
    });

    // Attach emails from MasterEmployee
    const employeeIds = candidates.map((c: any) => c.employeeId).filter(Boolean) as string[];
    const masterEmployees = await prisma.masterEmployee.findMany({
      where: { employeeId: { in: employeeIds } },
      select: { employeeId: true, email: true }
    });
    const emailMap = new Map(masterEmployees.map((me: any) => [me.employeeId, me.email]));
    const candidatesWithEmail = candidates.map((c: any) => ({
      ...c,
      email: c.employeeId ? emailMap.get(c.employeeId) || null : null
    }));

    const clients = await prisma.client.findMany({
      orderBy: { name: "asc" }
    });

    // Only show tabs for clients that have DRA candidates
    const activeClients = clients.filter((client: any) => 
      candidates.some((c: any) => c.clientId === client.id)
    );

    const certifiedCount = candidatesWithEmail.filter((c: any) => 
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
                  Verified Debt Recovery Agents organized client-wise.
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
                    <h3 className="text-5xl font-black text-foreground">{candidatesWithEmail.length}</h3>
                </div>
            </div>
            <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden border-emerald-500/20 bg-emerald-500/5 group">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-500 group-hover:scale-110 transition-transform">
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
                    <h3 className="text-5xl font-black text-foreground">{candidatesWithEmail.length - certifiedCount}</h3>
                </div>
            </div>
        </div>

        {/* Table Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
              <Database className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold uppercase tracking-tight">DRA Registry Workspace</h3>
          </div>

          {activeClients.length > 0 ? (
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="bg-accent/30 p-1 rounded-2xl w-fit flex flex-wrap gap-1">
                <TabsTrigger value="all" className="px-6 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                  All Clients ({candidatesWithEmail.length})
                </TabsTrigger>
                {activeClients.map((client: any) => {
                  const clientCands = candidatesWithEmail.filter((c: any) => c.clientId === client.id);
                  return (
                    <TabsTrigger key={client.id} value={client.id} className="px-6 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                      {client.name} ({clientCands.length})
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value="all" className="animate-in fade-in duration-300">
                <div className="bg-card/30 rounded-3xl p-1">
                  <CandidateTable candidates={candidatesWithEmail} role={role} />
                </div>
              </TabsContent>
              {activeClients.map((client: any) => {
                const clientCands = candidatesWithEmail.filter((c: any) => c.clientId === client.id);
                return (
                  <TabsContent key={client.id} value={client.id} className="animate-in fade-in duration-300">
                    <div className="bg-card/30 rounded-3xl p-1">
                      <CandidateTable candidates={clientCands} role={role} />
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          ) : (
            <div className="bg-card/30 rounded-3xl p-1">
              <CandidateTable candidates={candidatesWithEmail} role={role} />
            </div>
          )}
        </div>
      </div>
    );
  } catch (err: any) {
    return <div className="p-8 text-center text-red-500 font-bold">Error loading DRA Certified data</div>;
  }
}
