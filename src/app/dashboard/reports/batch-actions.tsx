"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generateReadyBatch } from "@/lib/actions/batch";
import { Download } from "lucide-react";
import { useSession } from "next-auth/react";

export function BatchActions() {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();

  if (session?.user?.role !== "ADMIN") return null;

  const handleGenerateBatch = () => {
    startTransition(async () => {
      await generateReadyBatch();
      alert("Batch generated successfully! Candidates moved to READY status.");
    });
  };

  return (
    <div className="flex gap-4">
      <Button 
        onClick={handleGenerateBatch} 
        disabled={isPending}
        className="rounded-xl font-bold h-12 px-6"
      >
        {isPending ? "Generating..." : "Generate Ready Batch"}
      </Button>
      <a href="/api/export">
        <Button variant="outline" className="rounded-xl font-bold h-12 px-6">
          <Download className="mr-2 h-4 w-4" />
          Download MIS Excel
        </Button>
      </a>
    </div>
  );
}
