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

    const avgVariance = totalVariance / sampleSize;
    return avgVariance;
  };

  const processImage = (file: File): Promise<{ blob: Blob; isGrayscale: boolean; colorVariance: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
              if (width > height) {
                  height = (maxDim / width) * height;
                  width = maxDim;
              } else {
                  width = (maxDim / height) * width;
                  height = maxDim;
              }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const colorVariance = getColorVariance(ctx, width, height);
          const isGrayscale = colorVariance < 15;

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Blob failed"));
                return;
              }
              resolve({ blob, isGrayscale, colorVariance });
            },
            "image/jpeg",
            0.95
          );
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const formatSize = (kb: number) => {
    if (kb >= 1024) return `${(kb / 1024).toFixed(0)}MB`;
    return `${kb}KB`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    let file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setErrorMessage("Please capture or select an image.");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    try {
      setStatus("uploading");
      setErrorMessage("");

      const { blob, isGrayscale, colorVariance } = await processImage(file);
      
      const isExempt = type === "SIGNATURE" || type === "QUALIFICATION";
      if (isGrayscale && !isExempt) {
        setStatus("error");
        setErrorMessage("Upload Rejected - Please upload an original coloured copy.");
        return;
      }

      const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
      file = new File([blob], newName, { type: "image/jpeg" });

      if (file.size > maxSizeKB * 1024) {
        setStatus("error");
        setErrorMessage(`Too large. Max ${formatSize(maxSizeKB)}.`);
        return;
      }

      // --- VALIDATION & OCR ---
      let isValid = true;
      let reason = "";

      // For Qualification/Signature/Photo, use client-side Tesseract for fast density checks
      if (type === "QUALIFICATION" || type === "PHOTO" || type === "SIGNATURE") {
          try {
              const Tesseract = (await import("tesseract.js")).default;
              const ocrResult = await Tesseract.recognize(file, "eng");
              const extractedText = ocrResult.data.text.toLowerCase();
              const textDensity = extractedText.length;
              
              if (type === "PHOTO" && textDensity > 200) {
                  isValid = false;
                  reason = "This looks like a document. Please upload a photo.";
              } else if (type === "SIGNATURE") {
                if (textDensity > 400) {
                    isValid = false;
                    reason = "Signature should not contain much text.";
                } else if (colorVariance > 40) {
                    isValid = false;
                    reason = "Verification Failed: This looks like a colorful photograph.";
                }
              } else if (type === "QUALIFICATION") {
                  const sub = subType?.toLowerCase() || "";
                  if (sub.includes("10th") || sub.includes("12th") || sub.includes("ssc") || sub.includes("hsc")) {
                      const isDegree = ["degree", "graduation", "provisional", "convocation", "university"].some(k => extractedText.includes(k));
                      if (isDegree) {
                          isValid = false;
                          reason = `This looks like a Degree. Please upload your ${subType} certificate.`;
                      }
                  } else if (sub.includes("graduation") || sub.includes("degree")) {
                      const isMarksheet = ["statement of marks", "marksheet", "board", "secondary"].some(k => extractedText.includes(k));
                      if (isMarksheet) {
                          isValid = false;
                          reason = `This looks like a Marksheet. Please upload your ${subType} certificate.`;
                      }
                  }
              }
          } catch (ocrErr) {
              console.error("Client OCR Error:", ocrErr);
          }
      }

      if (!isValid) {
        setStatus("error");
        setErrorMessage(reason);
        return;
      }

      // --- SERVER-SIDE OCR FOR ID_PROOF ---
      if (type === "ID_PROOF") {
        setErrorMessage("Detecting ID Number...");
        const ocrFormData = new FormData();
        ocrFormData.append("file", file);

        const ocrResponse = await fetch("/api/extract-id", {
          method: "POST",
          body: ocrFormData,
        });

        const ocrData = await ocrResponse.json();

        if (ocrData.success && ocrData.idNumber) {
          onOcrSuccess?.(ocrData.idNumber);
          setErrorMessage(`${ocrData.idType} detected`);
        } else {
          setStatus("error");
          setErrorMessage("Unable to detect ID Number. Please upload a clearer copy.");
          return;
        }
      }

      // --- FINAL UPLOAD ---
      const formData = new FormData();
      formData.append("candidateId", candidateId);
      formData.append("type", type);
      formData.append("file", file);

      await uploadDocument(formData);
      setStatus("success");
      onUploadSuccess?.(type);
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setErrorMessage(error.message || "Upload failed");
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {label} {mandatory && <span className="text-red-500">*</span>}
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
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                {type === "PHOTO" ? <User className="h-7 w-7 opacity-50" /> : <Upload className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-sm font-bold">Select File</p>
                <p className="text-[10px] text-muted-foreground uppercase">{description || `Max ${formatSize(maxSizeKB)}`}</p>
              </div>
            </>
          )}
          {status === "uploading" && (
             <div className="flex flex-col items-center gap-2">
               <Loader2 className="h-6 w-6 animate-spin text-primary" />
               <p className="text-[10px] font-bold text-primary animate-pulse">
                 {errorMessage || "EXTRACTING ID..."}
               </p>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
