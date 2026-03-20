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
  revalidatePath("/dashboard", "layout");
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
  revalidatePath("/dashboard", "layout");
}

export async function deleteDocument(documentId: string, candidateId: string) {
  // Delete the incorrect document
  await prisma.document.delete({
    where: { id: documentId },
  });
  
  // Revert the candidate's status to PENDING so they can re-upload
  await prisma.candidate.update({
    where: { id: candidateId },
    data: { status: "PENDING" }
  });

  revalidatePath("/dashboard", "layout");
}

export async function deleteCandidate(candidateId: string) {
  // Clean up relational documents first to avoid constraint exceptions
  await prisma.document.deleteMany({
    where: { candidateId }
  });

  // Obliterate the candidate record
  await prisma.candidate.delete({
    where: { id: candidateId }
  });

  revalidatePath("/dashboard", "layout");
}
