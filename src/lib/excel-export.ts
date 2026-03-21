import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";

export async function exportToExcel(role?: string, vendorName?: string) {
  const whereClause: any = { name: { not: null } };
  
  if (role === "VENDOR") {
    if (vendorName) {
      const vName = vendorName.toUpperCase();
      const baseSearch = vendorName.substring(0, 4); 

      whereClause.OR = [
        { employer: { contains: vendorName, mode: "insensitive" } },
        { employer: { contains: baseSearch, mode: "insensitive" } }
      ];

      if (vName.includes("TVS")) {
        whereClause.OR.push({ employer: { contains: "TVS", mode: "insensitive" } });
      }
      if (vName.includes("BOB") || vName.includes("BARODA")) {
        whereClause.OR.push({ employer: { contains: "BOB", mode: "insensitive" } });
        whereClause.OR.push({ employer: { contains: "Baroda", mode: "insensitive" } });
      }
    } else {
      whereClause.id = "force-empty-result-security";
    }
  }

  const candidates = await prisma.candidate.findMany({
    where: whereClause,
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
