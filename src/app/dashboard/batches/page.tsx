"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generateReadyBatch } from "@/lib/actions/batch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Download, Package } from "lucide-react";

export function BatchActions() {
  const [isPending, startTransition] = useTransition();

  const handleGenerateBatch = () => {
    startTransition(async () => {
      await generateReadyBatch();
      alert("Batch generated successfully! Candidates moved to READY status.");
    });
  };

  return (
    <div className="flex gap-4">
      <Button onClick={handleGenerateBatch} disabled={isPending}>
        {isPending ? "Generating..." : "Generate Ready Batch"}
      </Button>
      <a href="/api/export">
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download MIS Excel
        </Button>
      </a>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function BatchesPage() {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Batches & Handoff</h2>
        <BatchActions />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batch Handoff</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
          <Package className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">No ZIP batches generated yet</h3>
          <p className="text-sm text-slate-500 max-w-sm text-center mt-1">
            Once candidates are marked as READY, you can generate a structured ZIP file containing their documents and data.
          </p>
          <a href="/api/export-zip">
            <Button variant="secondary" className="mt-6">
              <Download className="mr-2 h-4 w-4" />
              Download Final ZIP
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
