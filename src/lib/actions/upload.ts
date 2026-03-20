"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
// Force local type to avoid Prisma export issues on Vercel
type DocumentType = "PHOTO" | "QUALIFICATION" | "ID_PROOF" | "SIGNATURE" | "ID_PROOF_FRONT" | "ID_PROOF_BACK";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const MAX_FILE_SIZES: Record<string, number> = {
  PHOTO: 10 * 1024 * 1024,
  QUALIFICATION: 10 * 1024 * 1024,
  ID_PROOF: 10 * 1024 * 1024,
  ID_PROOF_FRONT: 10 * 1024 * 1024,
  ID_PROOF_BACK: 10 * 1024 * 1024,
  SIGNATURE: 10 * 1024 * 1024,
};

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

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = `${candidateId}/${type}-${Date.now()}-${file.name}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    })
  );

  const fileUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

  const document = await prisma.document.create({
    data: {
      candidateId,
      type,
      fileUrl,
      sizeKB: Math.round(fileSize / 1024),
    },
  });

  // Track activity
  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      lastActiveAt: new Date(),
      currentStep: "UPLOADING_DOCS"
    }
  });

  return document;
}

