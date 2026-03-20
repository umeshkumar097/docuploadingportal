"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { DocumentType } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const MAX_FILE_SIZES = {
  PHOTO: 20 * 1024, // 20KB
  QUALIFICATION: 201 * 1024, // 201KB
  ID_PROOF: 25 * 1024, // 25KB
  SIGNATURE: 20 * 1024, // 20KB
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

  return document;
}

