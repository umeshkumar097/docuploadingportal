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
  GraduationCap
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

interface ClientTrainedUploadProps {
  clientId: string;
  clientName: string;
}

export function ClientTrainedUpload({ clientId, clientName }: ClientTrainedUploadProps) {
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
      
      if (data.length > 1) {
        const extractedHeaders = data[0] as string[];
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
      const res = await fetch(`/api/clients/${clientId}/upload-trained`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ employeeIds, trainingMonth: trainingMonth.trim() }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setResult(data);
      toast.success(data.message || "Trained candidates updated successfully");
      setFile(null);
      setParsedData([]);
      router.refresh(); // Refresh the page to update the tabs
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
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Upload Trained Candidates</h2>
          <p className="text-muted-foreground text-sm">Upload a list of Employee IDs to mark them as <span className="text-primary font-bold">Trained</span> for {clientName}.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Excel/CSV File</Label>
          <div 
            className={`border-2 border-dashed rounded-3xl p-10 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-accent/10 ${file ? 'border-primary/50 bg-primary/5' : 'border-accent/20'}`}
            onClick={() => document.getElementById("trained-file-input")?.click()}
          >
            <Input 
              id="trained-file-input"
              type="file" 
              accept=".xlsx,.xls,.csv" 
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
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
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
          disabled={!file || isUploading || !employeeIdColumn}
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
              Mark as Trained
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
                {result.count > 0 && (
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    {result.count} candidates successfully marked as Trained and moved.
                  </p>
                )}
                {result.notFound > 0 && (
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    {result.notFound} Employee IDs were not found in this client's submitted data.
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
