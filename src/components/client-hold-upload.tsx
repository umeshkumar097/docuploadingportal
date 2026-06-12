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
  PauseCircle
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

interface ClientHoldUploadProps {
  clientId: string;
  clientName: string;
}

export function ClientHoldUpload({ clientId, clientName }: ClientHoldUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [employeeIdColumn, setEmployeeIdColumn] = useState<string>("");
  const [trainingMonth, setTrainingMonth] = useState<string>("");
  const [parsedData, setParsedData] = useState<any[]>([]);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (!selectedFile) {
      setHeaders([]);
      setEmployeeIdColumn("");
      setParsedData([]);
      return;
    }

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      let extractedHeaders: string[] = [];
      for (const row of data) {
        if (Array.isArray(row)) {
          const valid = row.filter(h => h && typeof h === 'string' && h.trim() !== '');
          if (valid.length > 0) {
            extractedHeaders = row as string[];
            break;
          }
        }
      }
      
      if (extractedHeaders.length > 0) {
        const validHeaders = extractedHeaders.filter(h => h && typeof h === 'string' && h.trim() !== '');
        setHeaders(validHeaders);
        
        // Auto-mapping logic for Employee ID
        const aliases = ["Employee Id", "Employee ID", "ID", "EmployeeID", "EMP ID NO", "EMP_ID", "EMP ID"];
        const match = validHeaders.find(h => aliases.some(alias => alias.toLowerCase() === h.trim().toLowerCase()));
        if (match) {
          setEmployeeIdColumn(match);
        }
        
        // Save the raw objects for uploading
        const objects: any[] = XLSX.utils.sheet_to_json(worksheet);
        setParsedData(objects);
      }
    } catch (err) {
      console.error("Failed to parse headers", err);
      toast.error("Failed to read file headers. Please ensure it's a valid Excel/CSV file.");
    }
  };

  const handleUpload = async () => {
    if (!file || !employeeIdColumn || parsedData.length === 0) {
      toast.error("Please select a file and map the Employee ID column.");
      return;
    }

    setIsUploading(true);
    setResult(null);

    // Extract employee IDs
    const employeeIds = parsedData
        .map(row => row[employeeIdColumn]?.toString().trim())
        .filter(Boolean);

    if (employeeIds.length === 0) {
        toast.error("No valid Employee IDs found in the selected column.");
        setIsUploading(false);
        return;
    }

    try {
      const res = await fetch(`/api/clients/${clientId}/upload-hold`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ employeeIds, trainingMonth: trainingMonth.trim() }),
      });

      const data = await res.json();

      setResult(data);
      if (!res.ok) {
        toast.error(data.error || "Upload failed");
      } else {
        toast.success(data.message || "Upload processed");
        setFile(null);
        setParsedData([]);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-card rounded-[2.5rem] p-8 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
          <PauseCircle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Upload Hold Candidates</h2>
          <p className="text-muted-foreground text-sm">Upload a list of Employee IDs to mark them as <span className="text-amber-500 font-bold">On Hold</span> for {clientName}.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Excel/CSV File</Label>
          <div 
            className={`border-2 border-dashed rounded-3xl p-10 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-accent/10 ${file ? 'border-amber-500/50 bg-amber-500/5' : 'border-accent/20'}`}
            onClick={() => document.getElementById("hold-file-input")?.click()}
          >
            <Input 
              id="hold-file-input"
              type="file" 
              accept=".xlsx,.xls,.csv" 
              className="hidden" 
              onChange={handleFileChange}
            />
            {file ? (
              <>
                <FileSpreadsheet className="h-12 w-12 text-amber-500 animate-bounce" />
                <div className="text-center">
                  <p className="font-bold text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </>
            ) : (
              <>
                <div className="h-16 w-16 rounded-full bg-accent/30 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-bold">Click to select Hold file</p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-tighter">Only .xlsx or .csv files are supported</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Training Month</Label>
          <Input 
            value={trainingMonth} 
            onChange={(e) => setTrainingMonth(e.target.value)} 
            placeholder="e.g. June 2026"
            className="rounded-xl border-accent/20 bg-accent/10 focus:ring-primary/20"
          />
        </div>

        {headers.length > 0 && (
          <div className="space-y-4 p-6 bg-accent/5 rounded-2xl border border-accent/20 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
              <h3 className="font-bold text-lg text-amber-500 flex items-center gap-2">
                <PauseCircle className="h-5 w-5" />
                Map Employee ID Column
              </h3>
              <p className="text-sm text-muted-foreground">Select which column in your Excel file contains the Employee IDs.</p>
            </div>
            <div className="space-y-1.5">
                <select 
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={employeeIdColumn}
                onChange={(e) => setEmployeeIdColumn(e.target.value)}
                >
                <option value="">-- Select Column --</option>
                {headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                ))}
                </select>
            </div>
          </div>
        )}

        <Button 
          onClick={handleUpload} 
          disabled={!file || !employeeIdColumn || isUploading}
          className="h-12 rounded-2xl w-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Upload Hold Candidates"
          )}
        </Button>
      </div>

      {result && (
        <div className={`p-6 rounded-3xl space-y-4 border ${result.success ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'}`}>
          <div className="flex items-start gap-4">
            {result.success ? (
              <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
            ) : (
              <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
            )}
            <div className="space-y-1 w-full">
              <h3 className="font-bold">{result.success ? "Success" : "Error"}</h3>
              <p className="text-sm text-muted-foreground">{result.message || result.error}</p>
              
              {result.count > 0 && (
                <div className="mt-4 p-4 rounded-2xl bg-background border flex items-center justify-between">
                  <span className="text-sm font-medium">Successfully Updated</span>
                  <span className="text-xl font-bold text-primary">{result.count}</span>
                </div>
              )}

              {result.missingDocsIds && result.missingDocsIds.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-bold text-amber-500">Incomplete Documents ({result.missingDocsIds.length})</p>
                  <p className="text-xs text-muted-foreground">The following IDs were skipped because their documents are pending/rejected:</p>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 max-h-32 overflow-y-auto font-mono">
                    {result.missingDocsIds.join(", ")}
                  </div>
                </div>
              )}

              {result.notFoundIds && result.notFoundIds.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-bold text-destructive">Not Found in Database ({result.notFoundIds.length})</p>
                  <p className="text-xs text-muted-foreground">The following IDs were skipped because they don't exist for this client:</p>
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive max-h-32 overflow-y-auto font-mono">
                    {result.notFoundIds.join(", ")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
