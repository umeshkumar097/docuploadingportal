import { auth } from "@/auth";
import { generateBatchZip } from "@/lib/zip-export";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const role = session?.user?.role || "OPS";
  const vendorName = (session?.user as any)?.vendorName;

  const buffer = await generateBatchZip(role, vendorName);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=batch_handoff.zip",
    },
  });
}
