"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  FileSpreadsheet, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Database
} from "lucide-react";
import { toast } from "sonner";

interface ClientMasterUploadProps {
  clientId: string;
  clientName: string;
}

export function ClientMasterUpload({ clientId, clientName }: ClientMasterUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [phase, setPhase] = useState("Phase 1");
  const [result, setResult] = useState<any>(null);

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("clientId", clientId);
    formData.append("phase", phase);

    try {
      const res = await fetch("/api/master-data/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setResult(data);
      toast.success(data.message || "Master data uploaded successfully");
      setFile(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-card rounded-[2.5rem] p-8 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Database className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Client Master Data</h2>
          <p className="text-muted-foreground text-sm">Upload employee records specifically for <span className="text-primary font-bold">{clientName}</span>.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Project Phase</Label>
          <Input 
            value={phase} 
            onChange={(e) => setPhase(e.target.value)} 
            placeholder="e.g. Phase 1, June 2026 Batch"
            className="rounded-xl border-accent/20 bg-accent/10 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Excel/CSV File</Label>
          <div 
            className={`border-2 border-dashed rounded-3xl p-10 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-accent/10 ${file ? 'border-primary/50 bg-primary/5' : 'border-accent/20'}`}
            onClick={() => document.getElementById("master-file-input")?.click()}
          >
            <Input 
              id="master-file-input"
              type="file" 
              accept=".xlsx,.xls,.csv" 
              className="hidden" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <>
                <FileSpreadsheet className="h-12 w-12 text-primary animate-bounce" />
                <div className="text-center">
                  <p className="font-bold text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground opacity-50" />
                <div className="text-center">
                  <p className="font-bold text-muted-foreground">Click to browse or drag & drop</p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-tighter">Only .xlsx or .csv files are supported</p>
                </div>
              </>
            )}
          </div>
        </div>

        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
          className="w-full py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              Processing Records...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 mr-3" />
              Upload Batch
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className={`p-6 rounded-[2rem] border ${result.success ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <div className="flex items-start gap-4">
              {result.success ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mt-1" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-500 mt-1" />
              )}
              <div>
                <p className={`font-bold ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
                  {result.message}
                </p>
                {result.duplicates && result.duplicates.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    Note: {result.duplicates.length} duplicate records were skipped because they already exist in this month's batch.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
