import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

    const { filename } = await req.json();
    if (!filename || !filename.endsWith(".zip")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const r2Key = `halltickets/uploads/${Date.now()}_${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: r2Key,
      ContentType: "application/zip",
    });

    // Presigned URL valid for 30 minutes (enough for 265MB upload)
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 1800 });

    return NextResponse.json({ presignedUrl, r2Key });
  } catch (error: any) {
    console.error("Presigned URL error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
