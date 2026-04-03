"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface BookRecipientUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookRecipientUpload({ isOpen, onClose, onSuccess }: BookRecipientUploadProps) {
  const [file, setFile] = useState<File | null>(null);
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

    try {
      const response = await fetch("/api/dashboard/book-master/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setStatus("success");
      setMessage(data.message || "Campaign list updated!");
      setFile(null);
      setTimeout(() => {
        onSuccess();
        onClose();
        setStatus("idle");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage(err.message || "An unexpected error occurred during upload.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 pb-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">Upload Campaign List</DialogTitle>
          <DialogDescription className="font-medium text-muted-foreground pt-2">
            Upload the official list of employees for this book delivery campaign. 
            This will update the "Pending" tracking list accurately.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6">
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
                <p className="text-xs text-emerald-500 font-black uppercase tracking-widest">Ready to sync</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="font-bold text-lg text-foreground">Select Recipient File</p>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                  Excel or CSV with Employee ID & Name
                </p>
              </div>
            )}
          </div>

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

          <div className="flex gap-3">
            <Button 
                variant="ghost"
                onClick={onClose}
                disabled={status === "uploading"}
                className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-widest text-xs"
            >
                Cancel
            </Button>
            <Button 
                onClick={handleUpload}
                disabled={!file || status === "uploading"}
                className="flex-[2] h-14 rounded-2xl font-bold tracking-wide shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02]"
            >
                {status === "uploading" ? (
                <>
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    Updating Master...
                </>
                ) : (
                <>
                    <UploadCloud className="h-5 w-5 mr-3" />
                    Start Campaign Sync
                </>
                )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
