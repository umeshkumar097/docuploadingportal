"use server";

import sharp from "sharp";
import { createWorker } from "tesseract.js";

export async function extractIdFromImage(formData: FormData) {
  const startTime = Date.now();
  let worker: any = null;
  
  try {
    const file = formData.get("file") as File;
    const subType = formData.get("subType") as string;

    if (!file) throw new Error("No file provided");

    console.log(`[OCR ACTION] Starting for ${file.name} (${subType})`);

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // ADVANCED PREPROCESSING: Binarization (Thresholding)
    // This is the single best way to improve OCR on colored IDs
    const processedBuffer = await sharp(inputBuffer)
      .resize(1000)
      .grayscale()
      .threshold(128) // 128 is the middle, makes it 100% black and white
      .toBuffer();

    console.log(`[OCR ACTION] Binarization complete in ${Date.now() - startTime}ms`);

    worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(processedBuffer);
    const cleanText = text.toUpperCase();
    
    console.log(`[OCR ACTION] RAW TEXT: "${cleanText.substring(0, 100)}"`);

    let idNumber: string | null = null;
    let idType: string | null = null;

    // Fuzzy Search for PAN
    if (subType === "PAN") {
        // Look for pattern anywhere in text
        const panMatch = cleanText.replace(/[^A-Z0-9\s]/g, "").match(/[A-Z0-9]{5}[ \-]?[0-9OIL]{4}[ \-]?[A-Z0-9]{1}/);
        if (panMatch) {
            const raw = panMatch[0].replace(/[ \-]/g, "");
            // Apply corrections
            idNumber = raw.split("").map((c, i) => {
                if (i < 5 || i === 9) return c.replace("0", "O").replace("1", "I").replace("5", "S").replace("8", "B");
                return c.replace("O", "0").replace("I", "1").replace("L", "1").replace("S", "5").replace("B", "8");
            }).join("");
            idType = "PAN";
        }
    } else if (subType === "AADHAAR") {
        const aadhaarMatch = cleanText.replace(/[^0-9]/g, "").match(/[0-9]{12}/);
        if (aadhaarMatch) {
            idNumber = aadhaarMatch[0];
            idType = "AADHAAR";
        }
    }

    console.log(`[OCR ACTION] Final Result: ${idType} - ${idNumber} (${Date.now() - startTime}ms)`);

    return {
      success: !!idNumber,
      idNumber,
      idType,
      error: idNumber ? null : "Could not find ID Number in text."
    };

  } catch (error: any) {
    console.error("[OCR ACTION] FATAL ERROR:", error.message);
    return { success: false, error: "Extraction failed. Please ensure the card is flat and clear." };
  } finally {
    if (worker) await worker.terminate();
  }
}
