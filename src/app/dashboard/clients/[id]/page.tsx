import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { CandidateTable } from "@/components/candidate-table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Building2, Users, FileBarChart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = session?.user?.role;

  if (!session || (role !== "ADMIN" && role !== "SUPERADMIN")) {
    redirect("/dashboard");
  }

  const client = await prisma.client.findUnique({
    where: { id }
  });

  if (!client) {
    redirect("/dashboard/godeye?tab=clients");
  }

  const candidates = await prisma.candidate.findMany({
    where: { clientId: id },
    include: {
      documents: true,
      _count: {
        select: { documents: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col gap-6">
        <Link href="/dashboard/godeye?tab=clients">
          <Button variant="ghost" size="sm" className="w-fit -ml-2 text-muted-foreground hover:text-primary gap-1 font-bold">
            <ChevronLeft className="h-4 w-4" /> Back to Clients
          </Button>
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl uppercase">
                {client.name.substring(0,2)}
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
                  {client.name}
                </h1>
                <p className="text-muted-foreground font-medium text-sm flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
                  <Building2 className="h-3 w-3" /> Client Data Overview
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="glass-card px-6 py-4 rounded-2xl border border-primary/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Users className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Total Candidates</p>
                    <p className="text-xl font-black text-foreground">{candidates.length}</p>
                </div>
            </div>
            <div className="glass-card px-6 py-4 rounded-2xl border border-primary/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <FileBarChart className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Completion Rate</p>
                    <p className="text-xl font-black text-foreground">
                        {candidates.length > 0 
                            ? `${Math.round((candidates.filter(c => c._count.documents >= 4).length / candidates.length) * 100)}%`
                            : "0%"}
                    </p>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-card/30 rounded-3xl p-1">
        <CandidateTable candidates={candidates} role={role || "ADMIN"} />
      </div>
    </div>
  );
}
