import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createWorker } from "tesseract.js";

export async function POST(req: NextRequest) {
  console.log(">>> [OCR SERVER] POST REQUEST RECEIVED");
  const startTime = Date.now();
  let worker: any = null;
  
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const subType = formData.get("subType") as string;

    if (!file) return NextResponse.json({ success: false, error: "No file" });

    console.log(`[OCR SERVER] Received ${file.name}, size: ${(file.size / 1024).toFixed(1)}KB`);

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Optimized Preprocessing
    const processedBuffer = await sharp(inputBuffer)
      .resize(1200) // Slightly higher for better accuracy
      .grayscale()
      .linear(1.5, -20) // Better contrast adjustment
      .sharpen()
      .toBuffer();

    console.log(`[OCR SERVER] Preprocessing done in ${Date.now() - startTime}ms`);

    // Worker-based Tesseract for better stability in Node
    worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(processedBuffer);
    
    const cleanText = text.toUpperCase().replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    console.log(`[OCR SERVER] Text: ${cleanText.substring(0, 80)}...`);

    let idNumber: string | null = null;
    let idType: string | null = null;

    if (subType === "PAN") {
        const panMatch = cleanText.match(/[A-Z]{5}[0-9OIL]{4}[A-Z]{1}/);
        if (panMatch) {
            idNumber = panMatch[0].replace(/O/g, "0").replace(/I/g, "1").replace(/L/g, "1");
            idType = "PAN";
        }
    } else if (subType === "AADHAAR") {
        const aadhaarMatch = cleanText.match(/[0-9]{4}[ \-]?[0-9]{4}[ \-]?[0-9]{4}/);
        if (aadhaarMatch) {
            idNumber = aadhaarMatch[0].replace(/[ \-]/g, "");
            idType = "AADHAAR";
        }
    }

    console.log(`[OCR SERVER] Result: ${idType} - ${idNumber} (${Date.now() - startTime}ms)`);

    return NextResponse.json({
      success: !!idNumber,
      idType,
      idNumber
    });

  } catch (error: any) {
    console.error("[OCR SERVER] FATAL ERROR:", error.message);
    return NextResponse.json({ success: false, error: error.message });
  } finally {
    if (worker) await worker.terminate();
  }
}
