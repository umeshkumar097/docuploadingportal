"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { DocumentType } from "@prisma/client";

const MAX_FILE_SIZES = {
  PHOTO: 20 * 1024, // 20KB
  QUALIFICATION: 201 * 1024, // 201KB
  ID_PROOF: 25 * 1024, // 25KB
  SIGNATURE: 20 * 1024, // 20KB
};

const uploadSchema = z.object({
  candidateId: z.string(),
  type: z.nativeEnum(DocumentType),
  fileSize: z.number(),
  fileData: z.string(), // Base64 or Blob URL placeholder
});

export async function uploadDocument(formData: FormData) {
  const candidateId = formData.get("candidateId") as string;
  const type = formData.get("type") as DocumentType;
  const file = formData.get("file") as File;

  if (!file) throw new Error("No file uploaded");

  const fileSize = file.size;

  // Validation
  if (fileSize > MAX_FILE_SIZES[type]) {
    throw new Error(`File size for ${type} must be less than ${MAX_FILE_SIZES[type] / 1024}KB`);
  }

  // Mock Upload to Cloud Storage
  // In reality, this would use Vercel Blob or AWS S3
  const fileUrl = `https://storage.placeholder.com/${candidateId}/${type}-${file.name}`;

  const document = await prisma.document.create({
    data: {
      candidateId,
      type,
      fileUrl,
      sizeKB: Math.round(fileSize / 1024),
    },
  });

  return document;
}
