import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import JSZip from "jszip";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const maxDuration = 300; // 5 minutes for processing

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

    const { r2Key, originalFilename } = await req.json();
    if (!r2Key) {
      return NextResponse.json({ error: "r2Key is required" }, { status: 400 });
    }

    // Download the ZIP from R2
    const getCmd = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: r2Key,
    });
    const s3Response = await s3.send(getCmd);

    if (!s3Response.Body) {
      return NextResponse.json({ error: "Failed to read ZIP from R2" }, { status: 500 });
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const reader = s3Response.Body.transformToWebStream().getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const buffer = Buffer.concat(chunks);

    // Parse ZIP
    const zip = new JSZip();
    const contents = await zip.loadAsync(buffer);

    const pdfFiles = Object.values(contents.files).filter(
      (f) => !f.dir && f.name.toLowerCase().endsWith(".pdf") && !f.name.includes("__MACOSX")
    );

    if (pdfFiles.length === 0) {
      return NextResponse.json({ error: "No PDF files found in the ZIP" }, { status: 400 });
    }

    const batchName = (originalFilename || r2Key.split("/").pop() || "batch").replace(".zip", "");

    // Create batch in DB
    const batch = await prisma.hallTicketBatch.create({
      data: {
        name: batchName,
        totalCount: pdfFiles.length,
      },
    });

    const batchId = batch.id;
    let uploadedCount = 0;

    for (const pdfFile of pdfFiles) {
      const pdfBuffer = await pdfFile.async("nodebuffer");

      const filenameParts = pdfFile.name.split("/");
      const filename = filenameParts[filenameParts.length - 1];
      const hallTicketNumber = filename.substring(0, 9);

      if (!hallTicketNumber || hallTicketNumber.length < 9) {
        console.warn(`Skipping ${filename} - doesn't meet 9-digit criteria.`);
        continue;
      }

      const pdfKey = `halltickets/${batchId}/${filename}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: pdfKey,
          Body: pdfBuffer,
          ContentType: "application/pdf",
        })
      );

      const fileUrl = `${process.env.R2_PUBLIC_URL}/${pdfKey}`;

      await prisma.hallTicket.upsert({
        where: { hallTicketNumber },
        update: { filePath: fileUrl, batchId },
        create: { hallTicketNumber, filePath: fileUrl, batchId },
      });

      uploadedCount++;
    }

    // Update count if some were skipped
    if (uploadedCount !== pdfFiles.length) {
      await prisma.hallTicketBatch.update({
        where: { id: batchId },
        data: { totalCount: uploadedCount },
      });
    }

    // Delete the temp ZIP from R2 after processing
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: r2Key }));
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${uploadedCount} hall tickets.`,
      batchId,
    });
  } catch (error: any) {
    console.error("Process ZIP error:", error);
    return NextResponse.json({ error: "Failed to process ZIP", details: error.message }, { status: 500 });
  }
}
