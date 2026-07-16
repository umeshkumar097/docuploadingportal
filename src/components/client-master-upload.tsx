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
import * as XLSX from "xlsx";

interface ClientMasterUploadProps {
  clientId: string;
  clientName: string;
}

export function ClientMasterUpload({ clientId, clientName }: ClientMasterUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [phase, setPhase] = useState("Phase 1");
  const [result, setResult] = useState<any>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [showMapping, setShowMapping] = useState(false);

  const SYSTEM_FIELDS = [
    { key: "employeeId", label: "Employee ID (Required)", required: true },
    { key: "employeeName", label: "Employee Name (Required)", required: true },
    { key: "personalMobileNo", label: "Mobile Number" },
    { key: "email", label: "Email Address" },
    { key: "draBatch", label: "DRA Batch" },
    { key: "addressLine1", label: "Address Line 1" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "pincode", label: "Pincode" },
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (!selectedFile) {
      setHeaders([]);
      setShowMapping(false);
      return;
    }

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length > 0) {
        const extractedHeaders = data[0] as string[];
        const validHeaders = extractedHeaders.filter(h => h && typeof h === 'string' && h.trim() !== '');
        setHeaders(validHeaders);
        
        // Auto-mapping logic
        const initialMapping: Record<string, string> = {};
        const aliases: Record<string, string[]> = {
          employeeId: ["Employee Id", "Employee ID", "ID", "EmployeeID", "EMP ID NO", "EMP_ID", "EMP ID"],
          employeeName: ["Employee Name", "Name", "NAME", "Full Name", "First_Name", "CANDIDATE NAME"],
          personalMobileNo: ["Personal Mobile No", "Contact Number ", "Mobile Number", "Mobile", "Contact Number", "Candidates PERSONAL Mobile No", "Phone"],
          email: ["Email", "Email id", "Mail id", "Email ID", "Candidates PERSONAL Email"],
          draBatch: ["DRA Batch", "Batch No", "Batch", "Batch_Code"],
          addressLine1: ["Address", "Adress line 1", "Address line 1", "Home Address", "Address_Line1"],
          city: ["City", "CITY", "Location"],
          state: ["State", "STATE"],
          pincode: ["Pincode", "Pincode ", "PINCODE", "Zip", "Zipcode"]
        };
        
        SYSTEM_FIELDS.forEach(field => {
          const fieldAliases = aliases[field.key] || [];
          const match = validHeaders.find(h => fieldAliases.some(alias => alias.toLowerCase() === h.trim().toLowerCase()));
          if (match) {
            initialMapping[field.key] = match;
          }
        });
        
        setColumnMapping(initialMapping);
        setShowMapping(true);
      }
    } catch (err) {
      console.error("Failed to parse headers", err);
      toast.error("Failed to read file headers. Please ensure it's a valid Excel/CSV file.");
    }
  };

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
    formData.append("columnMapping", JSON.stringify(columnMapping));

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
              accept=".xlsx,.xls,.xlsb,.csv" 
              className="hidden" 
              onChange={handleFileChange}
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
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-tighter">Only .xlsx, .xlsb or .csv files are supported</p>
                </div>
              </>
            )}
          </div>
        </div>

        {showMapping && headers.length > 0 && (
          <div className="space-y-4 p-6 bg-accent/5 rounded-2xl border border-accent/20 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                <Database className="h-5 w-5" />
                Map Excel Columns
              </h3>
              <p className="text-sm text-muted-foreground">Match your Excel columns to the system fields. We've auto-mapped what we could find.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SYSTEM_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center justify-between">
                    {field.label}
                    {field.required && <span className="text-red-500 text-[10px] uppercase tracking-wider">Required</span>}
                  </Label>
                  <select 
                    className={`flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${field.required && !columnMapping[field.key] ? 'border-red-500/50 bg-red-500/5' : 'border-input'}`}
                    value={columnMapping[field.key] || ""}
                    onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                  >
                    <option value="">-- Select Column --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading || !columnMapping.employeeId || !columnMapping.employeeName}
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
