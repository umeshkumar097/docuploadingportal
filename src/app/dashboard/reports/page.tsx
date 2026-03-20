import prisma from "@/lib/prisma";
import { auth } from "@/auth";
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
      take: 10,
    });

    return (
      <div className="p-20">
        <h1 className="text-4xl font-black">Reports Diagnostic Phase 2</h1>
        <p className="mt-4 text-muted-foreground">Session Role: {role}</p>
        <p className="mt-2 text-muted-foreground">Candidates Found: {candidates.length}</p>
        <pre className="mt-8 p-4 bg-muted rounded-xl text-xs overflow-auto max-h-96">
          {JSON.stringify(candidates, null, 2)}
        </pre>
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
