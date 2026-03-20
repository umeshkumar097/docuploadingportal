"use server";

import prisma from "@/lib/prisma";
// Force local types to avoid Prisma export issues on Vercel
type CandidateStatus = "PENDING" | "OPS_VERIFIED" | "VALIDATED" | "REJECTED" | "READY";
type DocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";
import { revalidatePath } from "next/cache";

export async function updateCandidateStatus(id: string, status: CandidateStatus) {
  await prisma.candidate.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/dashboard");
}

export async function updateDocumentStatus(
  id: string,
  status: DocumentStatus,
  rejectionReason?: string
) {
  await prisma.document.update({
    where: { id },
    data: { status, rejectionReason },
  });
  revalidatePath("/dashboard");
}
