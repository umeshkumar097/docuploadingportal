"use client";

import { useState } from "react";
import { uploadDocument } from "@/lib/actions/upload";
import { Upload, CheckCircle2, AlertCircle, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  candidateId: string;
  type: string;
  label: string;
  maxSizeKB: number;
  mandatory?: boolean;
  description?: string;
}

export function FileUpload({ candidateId, type, label, maxSizeKB, mandatory, description }: FileUploadProps) {
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fileName, setFileName] = useState("");

  const convertToJpeg = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
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
    
    try {
      setStatus("uploading");

      // 1. Mandatory JPEG Conversion for all images
      if (file.type.startsWith("image/")) {
        console.log(`Converting ${file.name} to JPEG...`);
        const jpegBlob = await convertToJpeg(file);
        // Create a new File object from the blob to keep the name but change extension
        const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
        file = new File([jpegBlob], newName, { type: "image/jpeg" });
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

      await uploadDocument(formData);
      setStatus("success");
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
          accept="image/*,.pdf"
        />

        <div className="relative z-0 flex flex-col items-center justify-center gap-3">
          {status === "idle" && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Upload className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">Select File</p>
                <div className="flex flex-col">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">PDF or Image up to {formatSize(maxSizeKB)}</p>
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
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center animate-in zoom-in duration-300">
                <FileText className="h-6 w-6" />
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
