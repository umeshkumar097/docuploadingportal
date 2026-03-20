import { generateBatchZip } from "@/lib/zip-export";

export async function GET() {
  const buffer = await generateBatchZip();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=batch_handoff.zip",
    },
  });
}
