"use client";

import { useState } from "react";
import { uploadDocument } from "@/lib/actions/upload";
import { Upload, CheckCircle2, AlertCircle, Loader2, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Tesseract from "tesseract.js";

interface FileUploadProps {
  candidateId: string;
  type: string;
  label: string;
  maxSizeKB: number;
  mandatory?: boolean;
  description?: string;
  onUploadSuccess?: (type: string) => void;
  onOcrSuccess?: (extractedText: string) => void;
}

export function FileUpload({ candidateId, type, label, maxSizeKB, mandatory, description, onUploadSuccess, onOcrSuccess }: FileUploadProps) {
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const checkIsGrayscale = (ctx: CanvasRenderingContext2D, width: number, height: number): boolean => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let totalVariance = 0;
    const sampleSize = 1000; // Sample 1000 pixels for performance
    const step = Math.max(1, Math.floor(data.length / (4 * sampleSize)));

    for (let i = 0; i < data.length; i += 4 * step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Variance between channels
      const variance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
      totalVariance += variance;
    }

    const avgVariance = totalVariance / sampleSize;
    console.log("[Color Analysis] Avg Variance:", avgVariance);
    return avgVariance < 15; // Threshold for B&W/Grayscale
  };

  const processImage = (file: File): Promise<{ blob: Blob; isGrayscale: boolean }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          // Scale down for analysis if too large
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
          
          const isGrayscale = checkIsGrayscale(ctx, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve({ blob, isGrayscale });
              else reject(new Error("Canvas toBlob failed"));
            },
            "image/jpeg",
            0.8
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

      // 1. Image Processing: JPEG Conversion + Color Analysis
      if (file.type.startsWith("image/")) {
        console.log(`Processing ${file.name}...`);
        const { blob, isGrayscale } = await processImage(file);
        
        if (isGrayscale) {
          setStatus("error");
          setErrorMessage("Upload Rejected - Please upload an original coloured copy. Black & White copies are not accepted.");
          return;
        }

        const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
        file = new File([blob], newName, { type: "image/jpeg" });
        setFileName(newName);
      }

      // 2. Size Validation (post-conversion)
      if (file.size > maxSizeKB * 1024) {
        setStatus("error");
        setErrorMessage(`Too large. Max ${formatSize(maxSizeKB)}.`);
        return;
      }

      const formData = new FormData();
      formData.append("candidateId", candidateId);
      formData.append("type", type);
      formData.append("file", file);

      // 3. Initiate Autonomous OCR in Background
      if (onOcrSuccess) {
        Tesseract.recognize(file, "eng")
          .then((result: any) => {
            const { text } = result.data;
            console.log("[OCR Raw Extraction]:", text);
            // Valid PAN format: 5 Letters, 4 Numbers, 1 Letter
            const panMatch = text.match(/[A-Z]{5}[0-9]{4}[A-Z]{1}/);
            if (panMatch) return onOcrSuccess(panMatch[0]);

            // Valid Aadhaar format: 12 digits (often spaced 4-4-4)
            const aadhaarMatch = text.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);
            if (aadhaarMatch) return onOcrSuccess(aadhaarMatch[0].replace(/\s/g, ""));

            // Valid DL Format (approximate Indian standard)
            const dlMatch = text.match(/[A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{11}/);
            if (dlMatch) return onOcrSuccess(dlMatch[0].replace(/[-\s]/g, ""));
          })
          .catch((err: any) => console.error("[OCR Engine Error]:", err));
      }

      await uploadDocument(formData);
      setStatus("success");
      onUploadSuccess?.(type);
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setErrorMessage(error.message || "Upload failed");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center">
            {label}
            {mandatory && <span className="text-red-500 ml-1 text-sm leading-none">*</span>}
        </label>
        {status === "success" && (
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Ready
            </span>
        )}
      </div>
      
      <div
        className={cn(
          "relative border-2 border-dashed rounded-[1.5rem] p-6 transition-all duration-300 text-center cursor-pointer group overflow-hidden",
          status === "idle" && "border-primary/10 bg-accent/30 hover:border-primary/30 hover:bg-accent/50",
          status === "uploading" && "border-primary/50 bg-primary/5 animate-pulse",
          status === "success" && "border-emerald-500/50 bg-emerald-500/5 shadow-inner shadow-emerald-500/5",
          status === "error" && "border-destructive/50 bg-destructive/5"
        )}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileChange}
          disabled={status === "uploading"}
          accept="image/*"
        />

        <div className="relative z-0 flex flex-col items-center justify-center gap-3">
          {status === "idle" && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                {type === "PHOTO" ? (
                  <User className="h-7 w-7 opacity-50" />
                ) : (
                  <Upload className="h-6 w-6" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">Select File</p>
                <div className="flex flex-col">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Camera or Image up to {formatSize(maxSizeKB)}</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight mt-1">Note: Only Original Coloured Copies Accepted</p>
                  {description && (
                    <p className="text-[10px] text-primary font-bold uppercase tracking-tight mt-1">{description}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {status === "uploading" && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-primary">Uploading...</p>
                <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">{fileName}</p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center animate-in zoom-in duration-300 overflow-hidden border border-emerald-500/20">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <FileText className="h-6 w-6" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-600">Verification Ready</p>
                <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">{fileName}</p>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-destructive/20 text-destructive flex items-center justify-center animate-in shake-in duration-300">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-destructive">{errorMessage}</p>
                <p className="text-[10px] text-muted-foreground font-medium underline cursor-pointer" onClick={() => setStatus("idle")}>Try again</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
