"use client";

import { useState, useEffect } from "react";
import { uploadDocument } from "@/lib/actions/upload";
import { Upload, CheckCircle2, AlertCircle, Loader2, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  candidateId: string;
  type: string;
  label: string;
  maxSizeKB: number;
  mandatory?: boolean;
  description?: string;
  initialSuccess?: boolean;
  onUploadSuccess?: (type: string) => void;
  onOcrSuccess?: (extractedText: string) => void;
  subType?: string;
  canReupload?: boolean;
}

export default function FileUpload({ 
  candidateId, 
  type, 
  label, 
  maxSizeKB, 
  mandatory, 
  description, 
  initialSuccess, 
  onUploadSuccess, 
  onOcrSuccess,
  subType,
  canReupload
}: FileUploadProps) {
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">(initialSuccess ? "success" : "idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatSize = (kb: number) => {
    if (kb >= 1024) return `${(kb / 1024).toFixed(0)}MB`;
    return `${kb}KB`;
  };

  // Helper to process image for better OCR accuracy
  const preprocessForOcr = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas not supported"));
            return;
          }

          // Optimal width for OCR
          const targetWidth = 1000;
          const scale = targetWidth / img.width;
          canvas.width = targetWidth;
          canvas.height = img.height * scale;

          // Apply high contrast and grayscale
          ctx.filter = "grayscale(1) contrast(1.5) brightness(1.1)";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          resolve(canvas.toDataURL("image/jpeg", 0.9));
        };
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("File read failed"));
      reader.readAsDataURL(file);
    });
  };

  const getColorVariance = (ctx: CanvasRenderingContext2D, width: number, height: number): number => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let totalVariance = 0;
    const sampleSize = 1000;
    const step = Math.max(1, Math.floor(data.length / (4 * sampleSize)));

    for (let i = 0; i < data.length; i += 4 * step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const variance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
      totalVariance += variance;
    }
    return totalVariance / sampleSize;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setErrorMessage("Please upload an image file.");
      return;
    }

    if (file.size > maxSizeKB * 1024) {
      setStatus("error");
      setErrorMessage(`File too large. Max ${formatSize(maxSizeKB)}.`);
      return;
    }

    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus("uploading");
    setErrorMessage("");

    try {
      let isValid = true;
      let errorMsg = "";
      let extractedId: string | null = null;

      // --- OCR & VALIDATION ---
      if (type === "ID_PROOF" || type === "QUALIFICATION" || type === "PHOTO" || type === "SIGNATURE") {
          const Tesseract = (await import("tesseract.js")).default;
          
          // Preprocess image for OCR
          const ocrImage = await preprocessForOcr(file);
          setErrorMessage("Extracting Data...");
          
          const result = await Tesseract.recognize(ocrImage, "eng");
          const text = result.data.text.toLowerCase();
          const cleanText = text.replace(/\n/g, " ").replace(/\s+/g, " ");

          // Document specific checks
          if (type === "PHOTO" && cleanText.length > 200) {
              isValid = false;
              errorMsg = "This looks like a document. Please upload a clear photo.";
          } else if (type === "SIGNATURE") {
              if (cleanText.length > 400) {
                  isValid = false;
                  errorMsg = "Signature should not contain much text.";
              }
          } else if (type === "QUALIFICATION") {
              const sub = subType?.toLowerCase() || "";
              if (sub.includes("10th") || sub.includes("12th")) {
                  if (["degree", "graduation", "university"].some(k => cleanText.includes(k))) {
                      isValid = false;
                      errorMsg = `Please upload your ${subType} marksheet, not a degree.`;
                  }
              } else if (sub.includes("degree") || sub.includes("graduation")) {
                  if (["marksheet", "statement of marks", "10th", "12th"].some(k => cleanText.includes(k))) {
                      isValid = false;
                      errorMsg = "Please upload your Degree certificate, not a marksheet.";
                  }
              }
          } else if (type === "ID_PROOF") {
              // ID Verification
              if (subType === "PAN") {
                  if (!["income tax", "permanent account", "pan"].some(k => cleanText.includes(k))) {
                      isValid = false;
                      errorMsg = "Invalid PAN Card. Please upload a clear original coloured copy.";
                  } else {
                      const panMatch = cleanText.toUpperCase().match(/[A-Z]{5}[0-9OIL]{4}[A-Z]{1}/);
                      if (panMatch) {
                          extractedId = panMatch[0].replace(/O/g, "0").replace(/I/g, "1").replace(/L/g, "1");
                          onOcrSuccess?.(extractedId);
                          setErrorMessage("PAN Detected: " + extractedId);
                      } else {
                          isValid = false;
                          errorMsg = "Could not detect PAN number. Please ensure the card is clear and well-lit.";
                      }
                  }
              } else if (subType === "AADHAAR") {
                  if (!["aadhaar", "unique", "government", "india"].some(k => cleanText.includes(k))) {
                      isValid = false;
                      errorMsg = "Invalid Aadhaar. Please upload a clear original coloured copy.";
                  } else {
                      const aadhaarMatch = cleanText.match(/[0-9]{4}[ \-]?[0-9]{4}[ \-]?[0-9]{4}/);
                      if (aadhaarMatch) {
                          extractedId = aadhaarMatch[0].replace(/[ \-]/g, "");
                          onOcrSuccess?.(extractedId);
                          setErrorMessage("Aadhaar Detected: " + extractedId);
                      } else {
                          isValid = false;
                          errorMsg = "Could not detect Aadhaar number. Please upload a clear original copy.";
                      }
                  }
              }
          }
      }

      if (!isValid) {
          setStatus("error");
          setErrorMessage(errorMsg);
          return;
      }

      // --- UPLOAD TO SERVER ---
      const formData = new FormData();
      formData.append("candidateId", candidateId);
      formData.append("type", type);
      formData.append("file", file);

      await uploadDocument(formData);
      setStatus("success");
      onUploadSuccess?.(type);

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "Failed to process document.");
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center">
            {label} {mandatory && <span className="text-red-500 ml-1 text-sm leading-none">*</span>}
        </label>
        {status === "success" && (
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Ready
            </span>
        )}
      </div>
      
      <div className={cn(
          "relative border-2 border-dashed rounded-[1.5rem] p-6 transition-all text-center cursor-pointer group",
          status === "idle" && "border-primary/10 bg-accent/30 hover:border-primary/30 hover:bg-accent/50",
          status === "uploading" && "border-primary/50 bg-primary/5 animate-pulse",
          status === "success" && "border-emerald-500/50 bg-emerald-500/5",
          status === "error" && "border-destructive/50 bg-destructive/5"
        )}>
        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileChange} disabled={status === "uploading"} accept="image/*" />
        <div className="flex flex-col items-center justify-center gap-3">
          {status === "idle" && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                {type === "PHOTO" ? <User className="h-7 w-7 opacity-50" /> : <Upload className="h-6 w-6" />}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold">Select File</p>
                <p className="text-[10px] text-muted-foreground uppercase">{description || `Max ${formatSize(maxSizeKB)}`}</p>
              </div>
            </>
          )}
          {status === "uploading" && (
             <div className="flex flex-col items-center gap-2">
               <Loader2 className="h-6 w-6 animate-spin text-primary" />
               <p className="text-[10px] font-bold text-primary animate-pulse">{errorMessage || "Processing..."}</p>
             </div>
          )}
          {status === "success" && (
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-emerald-500/20">
              {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" /> : <FileText className="h-6 w-6" />}
            </div>
          )}
          {status === "error" && (
            <>
              <AlertCircle className="h-6 w-6 text-destructive" />
              <p className="text-xs font-bold text-destructive">{errorMessage}</p>
              <p className="text-[10px] text-muted-foreground underline">Try another photo</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
