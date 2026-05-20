import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function GET() {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPERADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const batches = await prisma.hallTicketBatch.findMany({
      orderBy: { uploadedAt: "desc" },
    });

    const totalPDFs = await prisma.hallTicket.count();
    const totalDownloads = await prisma.hallTicketDownloadLog.count();

    return NextResponse.json({
      batches,
      stats: { totalPDFs, totalDownloads }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPERADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
    }

    // Get all hall tickets for this batch to delete them from S3
    const hallTickets = await prisma.hallTicket.findMany({
      where: { batchId: id }
    });

    for (const ht of hallTickets) {
      // Extract key from filePath. 
      // filePath is usually: https://pub-...r2.dev/halltickets/batchId/filename.pdf
      // We want to delete the object using its Key.
      const urlParts = ht.filePath.split("/");
      const filename = urlParts[urlParts.length - 1];
      const r2Key = `halltickets/${id}/${filename}`;

      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: r2Key,
          })
        );
      } catch (s3Error) {
        console.error("Failed to delete from R2:", r2Key, s3Error);
      }
    }

    // The database cascade delete will handle HallTicket and HallTicketDownloadLog records
    await prisma.hallTicketBatch.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Batch deleted successfully." });
  } catch (error: any) {
    console.error("Delete Batch error:", error);
    return NextResponse.json({ error: "Failed to delete batch", details: error.message }, { status: 500 });
  }
}
