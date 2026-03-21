import JSZip from "jszip";
import { exportToExcel } from "./excel-export";
import prisma from "@/lib/prisma";

export async function generateBatchZip(role?: string, vendorName?: string) {
  const zip = new JSZip();
  
  // 1. Add Excel file
  const excelBuffer = await exportToExcel(role, vendorName);
  zip.file("candidates_mis.xlsx", excelBuffer);

  const whereClause: any = { status: "READY", name: { not: null } };
  
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

  // 2. Add Documents folder (Simplified for now - would need to fetch files from R2)
  const readyCandidates = await prisma.candidate.findMany({
    where: whereClause,
    include: { documents: true },
  });

  const docsFolder = zip.folder("documents");
  
  for (const candidate of readyCandidates) {
    const candidateFolder = docsFolder?.folder(candidate.name || candidate.id);
    for (const doc of candidate.documents) {
      // In a real implementation, you would fetch the file from R2 using the doc.fileUrl
      // and add it to the zip. For now, we add a placeholder.
      candidateFolder?.file(`${doc.type}.txt`, `Link to file: ${doc.fileUrl}`);
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  return zipBuffer;
}
