"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function generateReadyBatch() {
  // Query all candidates where status === 'VALIDATED'
  // Actually, I'll just update all that are ready to go to the final status
  const candidates = await prisma.candidate.updateMany({
    where: { status: "VALIDATED" },
    data: { status: "READY" },
  });

  revalidatePath("/dashboard");
  return candidates;
}
