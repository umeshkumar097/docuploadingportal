"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  X,
  Truck
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface DispatchedUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DispatchedUpload({ isOpen, onClose, onSuccess }: DispatchedUploadProps) {
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
      const response = await fetch("/api/dashboard/book-dispatched/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setStatus("success");
      setMessage(data.message || "Dispatched list updated!");
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
          <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
            <Truck className="h-6 w-6 text-emerald-500" />
            Upload Dispatched List
          </DialogTitle>
          <DialogDescription className="font-medium text-muted-foreground pt-2">
            Upload the list of employees who have **already received** their books. 
            This will move them from the Pending/Submissions lists.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <div className="w-full relative border-2 border-dashed border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors rounded-[2rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer group">
            <input 
              type="file" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              onChange={handleFileChange}
              disabled={status === "uploading"}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
              <FileSpreadsheet className="h-8 w-8 opacity-80" />
            </div>
            
            {file ? (
              <div className="space-y-1">
                <p className="font-bold text-lg text-emerald-600">{file.name}</p>
                <p className="text-xs text-emerald-500 font-black uppercase tracking-widest">Marking as Dispatched</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="font-bold text-lg text-foreground">Select Sent List</p>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                  Excel or CSV with Employee IDs
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
                className="flex-[2] h-14 rounded-2xl font-bold tracking-wide shadow-lg shadow-emerald-500/20 bg-emerald-600 text-white hover:bg-emerald-500 transition-all hover:scale-[1.02]"
            >
                {status === "uploading" ? (
                <>
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    Updating Status...
                </>
                ) : (
                <>
                    <UploadCloud className="h-5 w-5 mr-3" />
                    Mark Dispatched
                </>
                )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
