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
import { ClientMasterUpload } from "@/components/client-master-upload";
import { ClientTrainedUpload } from "@/components/client-trained-upload";
import { ClientHoldUpload } from "@/components/client-hold-upload";
import { Database, ClipboardCheck, GraduationCap, PauseCircle } from "lucide-react";

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
    where: { 
      clientId: id
    },
    include: {
      documents: true,
      _count: {
        select: { documents: true }
      }
    },
    orderBy: { createdAt: "desc" }
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

  const regularCandidates = candidatesWithEmail.filter((c: any) => !c.isDraCertified && c.status !== "TRAINED" && c.status !== "ON_HOLD");
  const draCandidates = candidatesWithEmail.filter((c: any) => c.isDraCertified && c.status !== "TRAINED" && c.status !== "ON_HOLD");
  const trainedCandidates = candidatesWithEmail.filter((c: any) => c.status === "TRAINED");
  const holdCandidates = candidatesWithEmail.filter((c: any) => c.status === "ON_HOLD");

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
          <TabsTrigger value="master" className="px-6 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Database className="h-4 w-4 mr-2" /> Master Data
          </TabsTrigger>
          <TabsTrigger value="settings" className="px-6 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Settings2 className="h-4 w-4 mr-2" /> Form Settings
          </TabsTrigger>
          <TabsTrigger value="dra" className="px-6 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <ClipboardCheck className="h-4 w-4 mr-2" /> Certified DRA
          </TabsTrigger>
          <TabsTrigger value="trained" className="px-6 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <GraduationCap className="h-4 w-4 mr-2" /> Trained
          </TabsTrigger>
          <TabsTrigger value="hold" className="px-6 py-2.5 rounded-xl font-bold text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <PauseCircle className="h-4 w-4 mr-2" /> Hold
          </TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-card/30 rounded-3xl p-1">
            <CandidateTable candidates={regularCandidates} role={role} storageKeyPrefix={`client_${id}_candidates_`} isClientView={true} />
          </div>
        </TabsContent>

        <TabsContent value="master" className="animate-in slide-in-from-bottom-2 duration-300">
          <div className="max-w-2xl">
            <ClientMasterUpload 
              clientId={client.id} 
              clientName={client.name} 
            />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="animate-in slide-in-from-bottom-2 duration-300">
          <ClientFormConfig 
            clientId={client.id} 
            initialConfig={client.formConfig} 
            initialCenters={client.examCenters} 
          />
        </TabsContent>

        <TabsContent value="dra" className="animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-card/30 rounded-3xl p-1">
            <CandidateTable candidates={draCandidates} role={role} storageKeyPrefix={`client_${id}_dra_`} isClientView={true} hideSubTabs={true} />
          </div>
        </TabsContent>

        <TabsContent value="trained" className="animate-in slide-in-from-bottom-2 duration-300 space-y-6">
          <div className="max-w-2xl">
            <ClientTrainedUpload 
              clientId={client.id} 
              clientName={client.name} 
            />
          </div>
          <div className="bg-card/30 rounded-3xl p-1 mt-6">
            <CandidateTable candidates={trainedCandidates} role={role} storageKeyPrefix={`client_${id}_trained_`} isClientView={true} hideSubTabs={true} />
          </div>
        </TabsContent>

        <TabsContent value="hold" className="animate-in slide-in-from-bottom-2 duration-300 space-y-6">
          <div className="max-w-2xl">
            <ClientHoldUpload 
              clientId={client.id} 
              clientName={client.name} 
            />
          </div>
          <div className="bg-card/30 rounded-3xl p-1 mt-6">
            <CandidateTable candidates={holdCandidates} role={role} storageKeyPrefix={`client_${id}_hold_`} isClientView={true} hideSubTabs={true} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
