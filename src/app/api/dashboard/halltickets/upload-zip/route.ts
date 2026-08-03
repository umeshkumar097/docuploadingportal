import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import JSZip from "jszip";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const maxDuration = 300; // Allow 5 minutes for large ZIP processing

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPERADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.name.endsWith(".zip")) {
      return NextResponse.json({ error: "Please upload a ZIP file" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const zip = new JSZip();
    const contents = await zip.loadAsync(buffer);

    // Filter out non-PDFs and macOS artifacts
    const pdfFiles = Object.values(contents.files).filter(
      (f) => !f.dir && f.name.toLowerCase().endsWith(".pdf") && !f.name.includes("__MACOSX")
    );

    if (pdfFiles.length === 0) {
      return NextResponse.json({ error: "No PDF files found in the ZIP" }, { status: 400 });
    }

    const batchName = file.name.replace(".zip", "");
    
    // Create batch in DB
    const batch = await prisma.hallTicketBatch.create({
      data: {
        name: batchName,
        totalCount: pdfFiles.length,
      },
    });

    let uploadedCount = 0;
    const batchId = batch.id;

    for (const pdfFile of pdfFiles) {
      const pdfBuffer = await pdfFile.async("nodebuffer");
      
      // Extract filename
      const filenameParts = pdfFile.name.split("/");
      const filename = filenameParts[filenameParts.length - 1]; // e.g. "802913734_1036_802913734.pdf"

      // The first 9 digits are the hall ticket number, as per user instructions
      const hallTicketNumber = filename.substring(0, 9);
      
      if (!hallTicketNumber || hallTicketNumber.length < 9) {
          console.warn(`Skipping ${filename} as it doesn't meet the 9-digit criteria.`);
          continue;
      }

      const r2Key = `halltickets/${batchId}/${filename}`;

      // Upload to R2
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: r2Key,
          Body: pdfBuffer,
          ContentType: "application/pdf",
        })
      );

      const fileUrl = `${process.env.R2_PUBLIC_URL}/${r2Key}`;

      // Upsert into DB
      await prisma.hallTicket.upsert({
        where: { hallTicketNumber },
        update: {
          filePath: fileUrl,
          batchId: batchId,
        },
        create: {
          hallTicketNumber,
          filePath: fileUrl,
          batchId: batchId,
        },
      });

      uploadedCount++;
    }

    // Update batch with actual uploaded count if some failed the regex/substring check
    if (uploadedCount !== pdfFiles.length) {
      await prisma.hallTicketBatch.update({
        where: { id: batchId },
        data: { totalCount: uploadedCount }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${uploadedCount} hall tickets.`,
      batchId: batch.id,
    });
  } catch (error: any) {
    console.error("Upload ZIP error:", error);
    return NextResponse.json(
      { error: "Failed to process ZIP file", details: error.message },
      { status: 500 }
    );
  }
}
