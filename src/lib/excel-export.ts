import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";

export async function exportToExcel() {
  const candidates = await prisma.candidate.findMany({
    include: { documents: true },
  });

  const data = candidates.map((c: any) => ({
    ID: c.id,
    Name: c.name,
    Employer: c.employer,
    Mobile: c.mobileNumber,
    "Employee ID": c.employeeId,
    Status: c.status,
    "Docs Count": c.documents.length,
    "Photo Status": c.documents.find((d: any) => d.type === "PHOTO")?.status || "N/A",
    "Qualification Status": c.documents.find((d: any) => d.type === "QUALIFICATION")?.status || "N/A",
    "ID Proof Status": c.documents.find((d: any) => d.type === "ID_PROOF")?.status || "N/A",
    "Signature Status": c.documents.find((d: any) => d.type === "SIGNATURE")?.status || "N/A",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");

  const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return buf;
}
