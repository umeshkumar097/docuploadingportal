"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Undo2,
  RefreshCcw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ResetSubmissionUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ResetSubmissionUpload({ isOpen, onClose, onSuccess }: ResetSubmissionUploadProps) {
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
      const response = await fetch("/api/dashboard/book-dispatched/revoke", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Reset failed");
      }

      setStatus("success");
      setMessage(data.message || "Addresses reset successfully!");
      setFile(null);
      setTimeout(() => {
        onSuccess();
        onClose();
        setStatus("idle");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage(err.message || "An unexpected error occurred during reset.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 pb-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
            <RefreshCcw className="h-6 w-6 text-orange-500" />
            Reset Incomplete Addresses
          </DialogTitle>
          <DialogDescription className="font-medium text-muted-foreground pt-2">
            Upload the list of employees with **incorrect/incomplete addresses**. 
            This will remove them from the Sent list and delete their current submission, 
            allowing them to fill the form again.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <div className="w-full relative border-2 border-dashed border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 transition-colors rounded-[2rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer group">
            <input 
              type="file" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              onChange={handleFileChange}
              disabled={status === "uploading"}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
              <FileSpreadsheet className="h-8 w-8 opacity-80" />
            </div>
            
            {file ? (
              <div className="space-y-1">
                <p className="font-bold text-lg text-orange-600">{file.name}</p>
                <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest leading-none">Ready to Reset</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="font-bold text-lg text-foreground">Select Incomplete List</p>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                   Match by Employee ID or WhatsApp/Mobile
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
                className="flex-[2] h-14 rounded-2xl font-bold tracking-wide shadow-lg shadow-orange-500/20 bg-orange-600 text-white hover:bg-orange-500 transition-all hover:scale-[1.02]"
            >
                {status === "uploading" ? (
                <>
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    Resetting Records...
                </>
                ) : (
                <>
                    <Undo2 className="h-5 w-5 mr-3" />
                    Reset & Enable Re-form
                </>
                )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
