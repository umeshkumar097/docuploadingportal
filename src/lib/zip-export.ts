import JSZip from "jszip";
import { exportToExcel } from "./excel-export";
import prisma from "@/lib/prisma";

export async function generateBatchZip() {
  const zip = new JSZip();
  
  // 1. Add Excel file
  const excelBuffer = await exportToExcel();
  zip.file("candidates_mis.xlsx", excelBuffer);

  // 2. Add Documents folder (Simplified for now - would need to fetch files from R2)
  const readyCandidates = await prisma.candidate.findMany({
    where: { status: "READY" },
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
