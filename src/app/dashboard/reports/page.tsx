import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { CandidateTable } from "@/components/candidate-table";
import { Database } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  try {
    const session = await auth();
    const role = session?.user?.role || "OPS";

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
      <div className="p-20 space-y-10">
        <div>
          <h1 className="text-4xl font-black">Reports Diagnostic Phase 3 (Table)</h1>
          <p className="mt-4 text-muted-foreground">Session Role: {role}</p>
        </div>

        <CandidateTable candidates={candidates} role={role} />
      </div>
    );
  } catch (err: any) {
    return (
      <div className="p-20 bg-red-500/10 border border-red-500/20 rounded-3xl">
        <h2 className="text-2xl font-bold text-red-600 flex items-center gap-2">
          <Database className="h-6 w-6" />
          Runtime Error Caught
        </h2>
        <pre className="mt-4 p-4 bg-black/5 rounded-xl text-xs overflow-auto">
          {err.stack || String(err)}
        </pre>
      </div>
    );
  }
}
