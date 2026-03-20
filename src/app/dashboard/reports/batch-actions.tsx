"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generateReadyBatch } from "@/lib/actions/batch";
import { Download } from "lucide-react";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { useState } from "react";

export function BatchActions({ role }: { role: string }) {
  const [isPending, startTransition] = useTransition();
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  if (role !== "ADMIN") return null;

  const handleGenerateBatch = () => {
    startTransition(async () => {
      await generateReadyBatch();
      setIsSuccessOpen(true);
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

      <ConfirmationModal 
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        onConfirm={() => setIsSuccessOpen(false)}
        title="Batch Generated"
        description="All validated candidates have been successfully moved to READY status and are now included in reports."
        confirmText="Done"
        variant="success"
      />
    </div>
  );
}
