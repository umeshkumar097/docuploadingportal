"use server";

import prisma from "@/lib/prisma";
import { CandidateStatus, DocumentStatus } from "@prisma/client";
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
