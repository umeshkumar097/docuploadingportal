"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { FileUp, Trash2, Search, FileText, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminHallTicketsPage() {
  const { data, error, mutate } = useSWR("/api/dashboard/halltickets/batches", fetcher);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith(".zip")) {
        toast.error("Please select a ZIP file");
        return;
      }
      setFile(selected);
    }
  };

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStage("Getting upload URL...");

    try {
      // Step 1: Get presigned URL from server
      const urlRes = await fetch("/api/dashboard/halltickets/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      });
      const urlJson = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlJson.error || "Failed to get upload URL");

      const { presignedUrl, r2Key } = urlJson;

      // Step 2: Upload ZIP directly to R2 (bypasses Vercel size limit)
      setUploadStage("Uploading ZIP to storage...");
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presignedUrl, true);
        xhr.setRequestHeader("Content-Type", "application/zip");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 80));
          }
        };
        xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      // Step 3: Tell server to process the ZIP from R2
      setUploadStage("Processing PDFs...");
      setUploadProgress(85);
      const processRes = await fetch("/api/dashboard/halltickets/process-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ r2Key, originalFilename: file.name }),
      });
      const processJson = await processRes.json();
      if (!processRes.ok) throw new Error(processJson.error || "Processing failed");

      setUploadProgress(100);
      toast.success(processJson.message);
      setFile(null);
      setUploadProgress(0);
      setUploadStage("");

      const fileInput = document.getElementById("zip-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to process ZIP file");
      setUploadProgress(0);
      setUploadStage("");
    } finally {
      setIsUploading(false);
    }
  };


  const handleDeleteBatch = async (id: string) => {
    if (!confirm("Are you sure you want to delete this batch and all its hall tickets? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/dashboard/halltickets/batches?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed");

      toast.success("Batch deleted successfully");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete batch");
    }
  };

  const isLoading = !data && !error;
  const batches = data?.batches || [];
  const stats = data?.stats || { totalPDFs: 0, totalDownloads: 0 };

  const filteredBatches = batches.filter((b: any) => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Hall Tickets</h1>
        <p className="text-muted-foreground mt-1">Manage and upload bulk PDF hall tickets for candidates.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-card border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total PDFs Hosted</p>
              <h3 className="text-2xl font-bold text-foreground">{stats.totalPDFs.toLocaleString()}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-card border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Download className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Downloads</p>
              <h3 className="text-2xl font-bold text-foreground">{stats.totalDownloads.toLocaleString()}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-card border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
              <FileUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Active Batches</p>
              <h3 className="text-2xl font-bold text-foreground">{batches.length}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Upload Area */}
      <Card className="p-6 bg-card border-border shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">Upload New Batch</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Select ZIP file containing PDFs
            </label>
            <Input 
              id="zip-upload"
              type="file" 
              accept=".zip" 
              onChange={handleFileChange}
              disabled={isUploading}
              className="bg-background border-input text-foreground h-12 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </div>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
            className="h-12 px-8 font-medium"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploadStage || "Processing..."}
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Upload & Process
              </>
            )}
          </Button>
        </div>
        {isUploading && uploadProgress > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{uploadStage}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Note: PDFs should be named like "802913734_1036_802913734.pdf". The first 9 digits will be used as the Hall Ticket Number.
        </p>
      </Card>

      {/* Batches List */}
      <Card className="p-6 bg-card border-border shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-lg font-semibold text-foreground">Upload History</h2>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search batches..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-input h-10 text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl bg-muted/20">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No batches uploaded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 font-medium">Batch Name</th>
                  <th className="pb-3 font-medium">PDF Count</th>
                  <th className="pb-3 font-medium">Upload Date</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBatches.map((batch: any) => (
                  <tr key={batch.id} className="text-sm text-foreground hover:bg-muted/50 transition-colors">
                    <td className="py-4 font-medium">{batch.name}</td>
                    <td className="py-4">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-semibold">
                        {batch.totalCount} PDFs
                      </span>
                    </td>
                    <td className="py-4 text-muted-foreground">
                      {new Date(batch.uploadedAt).toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteBatch(batch.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
