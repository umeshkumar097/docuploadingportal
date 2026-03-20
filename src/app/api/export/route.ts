import { exportToExcel } from "@/lib/excel-export";

export const dynamic = "force-dynamic";

export async function GET() {
  const buffer = await exportToExcel();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=candidates_mis.xlsx",
    },
  });
}
