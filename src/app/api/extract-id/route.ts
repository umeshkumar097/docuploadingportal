import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import Tesseract from "tesseract.js";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: "No file uploaded",
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Improve image quality and RESIZE before OCR to speed up
    const processedBuffer = await sharp(inputBuffer)
      .resize(1000) // Resize to 1000px width for faster OCR
      .grayscale()
      .sharpen()
      .normalize()
      .toBuffer();

    // OCR using Tesseract.js
    const result = await Tesseract.recognize(
      processedBuffer,
      "eng"
    );

    // Clean OCR text
    const text = result.data.text
      .toUpperCase()
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    console.log("OCR TEXT:", text);

    // PAN Detection
    const panMatch = text.match(
      /[A-Z]{5}[0-9]{4}[A-Z]{1}/
    );

    // Aadhaar Detection
    const aadhaarMatch = text.match(
      /\b[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}\b/
    );

    const idNumber =
      panMatch?.[0] ||
      aadhaarMatch?.[0] ||
      null;

    const idType = panMatch
      ? "PAN"
      : aadhaarMatch
      ? "AADHAAR"
      : null;

    return NextResponse.json({
      success: true,
      idType,
      idNumber,
      extractedText: text,
    });

  } catch (error) {
    console.error("OCR ERROR:", error);

    return NextResponse.json({
      success: false,
      idType: null,
      idNumber: null,
      error: "OCR extraction failed",
    });
  }
}
