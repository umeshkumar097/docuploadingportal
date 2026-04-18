import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { CandidateTable } from "@/components/candidate-table";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  Building2, 
  Settings2,
  ListFilter
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientFormConfig } from "@/components/client-form-config";

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
    redirect("/dashboard/admin?tab=clients");
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
        <Link href="/dashboard/admin?tab=clients">
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
        </div>
      </div>

      <Tabs defaultValue="candidates" className="space-y-8">
        <TabsList className="bg-accent/30 p-1 rounded-2xl w-fit">
          <TabsTrigger value="candidates" className="px-6 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <ListFilter className="h-4 w-4 mr-2" /> Candidates
          </TabsTrigger>
          <TabsTrigger value="settings" className="px-6 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Settings2 className="h-4 w-4 mr-2" /> Form Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-card/30 rounded-3xl p-1">
            <CandidateTable candidates={candidates} role={role || "ADMIN"} />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="animate-in slide-in-from-bottom-2 duration-300">
          <ClientFormConfig 
            clientId={client.id} 
            initialConfig={client.formConfig} 
            initialCenters={client.examCenters} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
