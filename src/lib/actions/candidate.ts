"use server";

import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function createCandidate(data: {
  name: string;
  employer: string;
  mobileNumber: string;
  employeeId: string;
}) {
  const token = uuidv4();

  const candidate = await prisma.candidate.create({
    data: {
      ...data,
      token,
    },
  });

  const submissionUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/submit/${token}`;

  return { candidate, submissionUrl };
}

export async function getCandidateByToken(token: string) {
  return await prisma.candidate.findUnique({
    where: { token },
    include: { documents: true },
  });
}
