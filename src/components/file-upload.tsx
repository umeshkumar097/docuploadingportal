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
}

export function FileUpload({ candidateId, type, label, maxSizeKB, mandatory }: FileUploadProps) {
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    if (file.size > maxSizeKB * 1024) {
      setStatus("error");
      setErrorMessage(`Too large. Max ${maxSizeKB}KB.`);
      return;
    }

    try {
      setStatus("uploading");
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
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">PDF or Image up to {maxSizeKB}KB</p>
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
