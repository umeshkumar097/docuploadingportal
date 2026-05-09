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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setErrorMessage("Please capture or select an image.");
      return;
    }

    if (file.size > maxSizeKB * 1024) {
      setStatus("error");
      setErrorMessage(`Too large. Max ${formatSize(maxSizeKB)}.`);
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    try {
      setStatus("uploading");
      setErrorMessage("");

      // --- SERVER-SIDE OCR FLOW ---
      let extractedIdNumber: string | null = null;
      let detectedIdType: string | null = null;

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
          extractedIdNumber = ocrData.idNumber;
          detectedIdType = ocrData.idType;
          onOcrSuccess?.(extractedIdNumber as string);
          setErrorMessage(`${detectedIdType} detected`);
        } else {
          setStatus("error");
          setErrorMessage("Unable to detect ID Number. Please upload a clearer copy.");
          return;
        }
      }

      // --- UPLOAD TO R2 STORAGE ---
      const uploadFormData = new FormData();
      uploadFormData.append("candidateId", candidateId);
      uploadFormData.append("type", type);
      uploadFormData.append("file", file);

      await uploadDocument(uploadFormData);
      
      setStatus("success");
      onUploadSuccess?.(type);
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setErrorMessage(error.message || "OCR extraction failed");
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
