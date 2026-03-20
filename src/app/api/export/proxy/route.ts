import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Fetch the file as an array buffer from R2
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch from R2: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    // Return the raw buffer with generous CORS to allow the frontend JSZip to read it
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Export Proxy Error:", error);
    return NextResponse.json({ error: "Failed to proxy file download" }, { status: 500 });
  }
}
