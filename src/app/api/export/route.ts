import { auth } from "@/auth";
import { exportToExcel } from "@/lib/excel-export";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const role = session?.user?.role || "OPS";
  const vendorName = (session?.user as any)?.vendorName;

  const buffer = await exportToExcel(role, vendorName);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=candidates_mis.xlsx",
    },
  });
}
