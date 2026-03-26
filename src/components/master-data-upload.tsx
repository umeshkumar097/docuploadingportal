"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export function MasterDataUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<string>("Phase 1");
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.match(/\.(xlsx|xls|csv)$/i)) {
      setStatus("error");
      setMessage("Please upload a valid Excel or CSV file.");
      setFile(null);
      return;
    }

    setFile(selected);
    setStatus("idle");
    setMessage("");
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("phase", phase);

    try {
      const response = await fetch("/api/master-data/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setStatus("success");
      setMessage(data.message || "Upload successful!");
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage(err.message || "An unexpected error occurred during upload.");
    }
  };

  return (
    <div className="glass-card p-8 rounded-3xl animate-in slide-in-from-bottom-2 duration-500">
      <div className="space-y-6">
        
        <div className="w-full relative border-2 border-dashed border-primary/20 bg-accent/30 hover:bg-accent/50 transition-colors rounded-[2rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer group">
          <input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            onChange={handleFileChange}
            disabled={status === "uploading"}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
            <FileSpreadsheet className="h-8 w-8 opacity-80" />
          </div>
          
          {file ? (
            <div className="space-y-1">
              <p className="font-bold text-lg text-primary">{file.name}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest text-emerald-500">Ready to upload</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-bold text-lg text-foreground">Click or drag Excel/CSV</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                Ensure columns match: Employee Id, Employee Name, State, Vendor, Active Status, etc.
              </p>
            </div>
          )}
        </div>

        {/* Status Indicators */}
        {status === "error" && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-2xl flex items-center gap-3 animate-in shake-in duration-300">
            <AlertCircle className="h-5 w-5" />
            <p className="font-bold text-sm tracking-tight">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in duration-300">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-bold text-sm tracking-tight">{message}</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4 border-t border-primary/5">
          <div className="space-y-2 flex-1 max-w-xs">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Phase</label>
            <input 
              type="text"
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              placeholder="e.g. Phase 1"
              disabled={status === "uploading"}
              className="w-full h-14 rounded-2xl bg-accent/30 border-2 border-primary/5 px-6 font-bold text-primary focus:border-primary/20 outline-none transition-all"
            />
          </div>

          <Button 
            onClick={handleUpload}
            disabled={!file || status === "uploading"}
            className="h-14 rounded-2xl px-10 font-bold tracking-wide shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02]"
          >
            {status === "uploading" ? (
              <>
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                Processing Upload...
              </>
            ) : (
              <>
                <UploadCloud className="h-5 w-5 mr-3" />
                Upload Master Data
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
