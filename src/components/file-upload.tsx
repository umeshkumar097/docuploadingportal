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
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const preprocessImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas Error");
          
          // Use high resolution for reading small text on marksheets
          canvas.width = 1600;
          canvas.height = (img.height / img.width) * 1600;
          
          // Extreme contrast for better OCR
          ctx.filter = "grayscale(1) contrast(2.5) brightness(1.1)";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          resolve(canvas.toDataURL("image/jpeg", 0.9));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus("uploading");
    setErrorMessage("");
    setProgress(0);

    try {
      setErrorMessage("Deep Scanning...");
      const Tesseract = (await import("tesseract.js")).default;
      const processed = await preprocessImage(file);
      
      const result = await Tesseract.recognize(processed, "eng", {
          logger: m => {
              if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100));
          }
      });
      
      const rawText = result.data.text.toUpperCase();
      console.log(`[OCR DEBUG] TYPE: ${type}, SUBTYPE: ${subType}`);
      console.log(`[OCR DEBUG] DETECTED TEXT:`, rawText.substring(0, 500));

      const hasIdPattern = /[A-Z]{5}[0-9]{4}[A-Z]{1}/.test(rawText) || /[2-9][0-9]{3}\s?[0-9]{4}\s?[0-9]{4}/.test(rawText);
      const hasDegreeKeywords = /DEGREE|UNIVERSITY|GRADUATE|BACHELOR|MASTER|CONVOCATION/.test(rawText);
      const hasProhibitedKeywords = /MARKSHEET|MARK SHEET|PROVISIONAL|MIGRATION|GRADE|STATEMENT|TRANSCRIPT|MARKS|RESULT/.test(rawText);
      const hasEduKeywords = hasDegreeKeywords || hasProhibitedKeywords || /BOARD|CERTIFICATE|PASSED|ROLL NO|EXAMINATION|MATRICULATION|SECONDARY|SCHOOL/.test(rawText);
      const isGovernmentDoc = /GOVERNMENT|INDIA|INCOME TAX|UNIQUE IDENTIFICATION|AADHAAR|PAN CARD/.test(rawText);

      // --- VALIDATION LOGIC ---
      
      if (type === "SIGNATURE") {
          const wordCount = rawText.split(/\s+/).filter(w => w.length > 2).length;
          if (hasEduKeywords || isGovernmentDoc || wordCount > 5 || rawText.length > 150) {
              setStatus("error");
              setErrorMessage("Document detected in Signature slot. Please upload ONLY your signature image.");
              return;
          }
      }

      if (type === "PHOTO") {
          if (isGovernmentDoc || hasIdPattern || hasEduKeywords || rawText.length > 200) {
              setStatus("error");
              setErrorMessage("This looks like a document. Please upload a clear photo of yourself.");
              return;
          }
      }

      if (type === "QUALIFICATION") {
          const currentLevel = (subType || "").toUpperCase();

          if (currentLevel === "GRADUATE") {
              // Rejection logic for Graduates: Reject if marksheet-specific words are found, EVEN IF degree keywords are present.
              if (hasProhibitedKeywords) {
                  setStatus("error");
                  setErrorMessage("Marksheet, Provisional or Migration detected. Only Original University Degree is allowed for Graduates.");
                  return;
              }
              if (!hasDegreeKeywords && !hasEduKeywords) {
                  setStatus("error");
                  setErrorMessage("Could not verify Degree Certificate. Ensure it is a clear coloured copy.");
                  return;
              }
          } else if (currentLevel === "UNDERGRADUATE") {
              // For 10th / 12th: Reject if it looks like a University Degree
              if (hasDegreeKeywords && !hasProhibitedKeywords) {
                  setStatus("error");
                  setErrorMessage("University Degree detected. Please upload 10th/12th Marksheet for this level.");
                  return;
              }
              if (!hasEduKeywords) {
                  setStatus("error");
                  setErrorMessage("Marksheet or Certificate not detected. Please upload a clear photo.");
                  return;
              }
          }
      }

      if (type === "ID_PROOF") {
          const idType = (subType || "").toUpperCase();
          let id = null;

          if (idType === "PAN") {
              const clean = rawText.replace(/[^A-Z0-9\s]/g, " ");
              const words = clean.split(/\s+/);
              for (let word of words) {
                  let s = word.replace(/[^A-Z0-9]/g, "");
                  if (s.length === 10) {
                      let res = s.split("").map((c, i) => {
                          if (i < 5 || i === 9) return c.replace("0", "O").replace("1", "I").replace("5", "S");
                          return c.replace("O", "0").replace("I", "1").replace("L", "1").replace("S", "5");
                      }).join("");
                      if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(res)) id = res;
                  }
              }
          } else if (idType === "AADHAAR") {
              const aadhaarMatch = rawText.match(/\b[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}\b/);
              if (aadhaarMatch) id = aadhaarMatch[0].replace(/\s/g, "");
          }

          if (id) {
              onOcrSuccess?.(id);
              setErrorMessage(`Verified: ${id}`);
          } else {
              setStatus("error");
              setErrorMessage(`Correct ${idType} Number not detected.`);
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

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage("System Error. Please try again.");
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center">
            {label} {mandatory && <span className="text-red-500 ml-1">*</span>}
        </label>
        {status === "success" && (
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Done
            </span>
        )}
      </div>
      
      <div className={cn(
          "relative border-2 border-dashed rounded-[2.5rem] p-8 transition-all text-center cursor-pointer group shadow-sm",
          status === "idle" && "border-primary/10 bg-accent/30 hover:border-primary/30 hover:bg-accent/50",
          status === "uploading" && "border-primary/50 bg-primary/5",
          status === "success" && "border-emerald-500/50 bg-emerald-500/5",
          status === "error" && "border-destructive/50 bg-destructive/5"
        )}>
        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileChange} disabled={status === "uploading"} accept="image/*" />
        <div className="flex flex-col items-center justify-center gap-4">
          {status === "idle" && (
            <>
              <div className="w-14 h-14 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                {type === "PHOTO" ? <User className="h-8 w-8 opacity-50" /> : <Upload className="h-7 w-7" />}
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold">Select {label}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">{description || `Maximum 10MB`}</p>
              </div>
            </>
          )}
          {status === "uploading" && (
             <div className="flex flex-col items-center gap-4 w-full">
               <div className="relative w-16 h-16">
                  <Loader2 className="h-16 w-16 animate-spin text-primary opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-primary">
                    {progress}%
                  </div>
               </div>
               <p className="text-xs font-bold text-primary uppercase tracking-widest animate-pulse">{errorMessage || "Scanning..."}</p>
               <div className="w-4/5 bg-primary/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progress}%` }} />
               </div>
             </div>
          )}
          {status === "success" && (
            <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden border-2 border-emerald-500/20 shadow-xl">
              {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" /> : <FileText className="h-8 w-8" />}
            </div>
          )}
          {status === "error" && (
            <>
              <AlertCircle className="h-8 w-8 text-destructive animate-bounce" />
              <div className="space-y-1 px-4">
                <p className="text-sm font-bold text-destructive leading-tight">{errorMessage}</p>
                <p className="text-[10px] text-muted-foreground underline uppercase tracking-widest font-black mt-2">Try Again</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
