"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, ChevronRight, FileArchive, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { deleteCandidate, bulkUpdateCandidateStatus } from "@/lib/actions/verification";
import * as XLSX from "xlsx";
import { ConfirmationModal } from "./confirmation-modal";

interface CandidateTableProps {
  candidates: any[];
  role: string;
}

export function CandidateTable({ candidates, role }: CandidateTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<{id: string, name: string} | null>(null);
  
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isBulkApproveModalOpen, setIsBulkApproveModalOpen] = useState(false);
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  const handleDeleteClick = (id: string, name: string) => {
    setCandidateToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const handleBulkApprove = async () => {
    setIsBulkApproving(true);
    try {
      await bulkUpdateCandidateStatus(selectedIds, "READY");
      setIsBulkApproveModalOpen(false);
      setSelectedIds([]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to approve candidates in bulk.");
      setIsErrorModalOpen(true);
    } finally {
      setIsBulkApproving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!candidateToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteCandidate(candidateToDelete.id);
      setIsDeleteModalOpen(false);
      setCandidateToDelete(null);
    } catch (err: any) {
      console.error(err);
      setIsDeleteModalOpen(false);
      setErrorMessage(err.message || "Failed to permanently delete candidate. This might be due to active network issues or restricted permissions.");
      setIsErrorModalOpen(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === candidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(candidates.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(checkedId => checkedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExportZip = async () => {
    if (selectedIds.length === 0) return;
    setIsExporting(true);
    setExportProgress(0);

    try {
      const selectedCandidates = candidates.filter(c => selectedIds.includes(c.id));
      const zip = new JSZip();
      
      let totalFilesToFetch = 0;
      let filesFetched = 0;

      selectedCandidates.forEach(c => {
        totalFilesToFetch += c.documents?.length || 0;
      });

      if (totalFilesToFetch === 0) {
        setIsExporting(false);
        return;
      }

      const isSingle = selectedCandidates.length === 1;
      const masterZipName = isSingle 
        ? `${selectedCandidates[0].employeeId || selectedCandidates[0].id}.zip`
        : `Export-${new Date().toISOString().split('T')[0]}.zip`;

      for (const candidate of selectedCandidates) {
        const candidateIdentifier = candidate.employeeId || candidate.id;
        const candidateZip = isSingle ? zip : new JSZip();
        
        if (!candidate.documents) continue;

        for (const doc of candidate.documents) {
          try {
            const res = await fetch(`/api/export/proxy?url=${encodeURIComponent(doc.fileUrl)}`);
            if (!res.ok) throw new Error("Proxy fetch failed");
            
            const blob = await res.blob();
            const urlParts = doc.fileUrl.split('.');
            const ext = urlParts.length > 1 ? urlParts.pop() : "jpg";
            const fileName = `${doc.type}.${ext}`;
            candidateZip.file(fileName, blob);
            
            filesFetched++;
            setExportProgress(Math.round((filesFetched / totalFilesToFetch) * 100));
          } catch (err) {
            console.error(`Failed to fetch ${doc.type} for ${candidateIdentifier}`, err);
          }
        }

        if (!isSingle) {
            const candidateZipBlob = await candidateZip.generateAsync({ type: "blob" });
            zip.file(`${candidateIdentifier}.zip`, candidateZipBlob);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, masterZipName);
      setSelectedIds([]);
    } catch (error) {
      console.error("ZIP Export failed", error);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleExportExcel = () => {
    const data = candidates.map(c => {
      const docStatus: any = {};
      c.documents?.forEach((doc: any) => {
        docStatus[doc.type] = doc.status;
      });

      return {
        "Registration Date": new Date(c.createdAt).toLocaleString(),
        "Candidate Name": c.name || "Anonymous",
        "Employer": c.employer || "N/A",
        "Mobile": c.mobileNumber || "N/A",
        "Employee ID": c.employeeId || "N/A",
        "ID Type": c.idType || "N/A",
        "Status": c.status,
        "Photo": docStatus["PHOTO"] || "Not Uploaded",
        "Qualification": docStatus["QUALIFICATION"] || "Not Uploaded",
        "ID Proof": docStatus["ID_PROOF"] || (docStatus["ID_PROOF_FRONT"] ? "Aadhaar Uploaded" : "Not Uploaded"),
        "Signature": docStatus["SIGNATURE"] || "Not Uploaded",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");
    
    // Set column widths
    const wscols = [
      { wch: 25 }, // Date
      { wch: 25 }, // Name
      { wch: 20 }, // Employer
      { wch: 15 }, // Mobile
      { wch: 15 }, // Emp ID
      { wch: 15 }, // ID Type
      { wch: 15 }, // Status
      { wch: 15 }, // Photo
      { wch: 15 }, // Qual
      { wch: 20 }, // ID Proof
      { wch: 15 }, // Sig
    ];
    worksheet["!cols"] = wscols;

    XLSX.writeFile(workbook, `Candidates-Report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Table Actions ToolBar */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border-2 border-primary/20 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-bottom-2 fade-in duration-300">
          <p className="font-bold text-primary ml-2">
            {selectedIds.length} candidate{selectedIds.length > 1 ? "s" : ""} selected for export
          </p>
          <div className="flex gap-2">
            {role === "ADMIN" && (
              <Button 
                onClick={() => setIsBulkApproveModalOpen(true)}
                className="rounded-xl shadow-lg shadow-emerald-500/10 font-black px-6 bg-emerald-500 hover:bg-emerald-600 text-white transition-all hover:scale-105"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve Selected
              </Button>
            )}
            {role === "ADMIN" && (
              <Button 
                onClick={handleExportExcel} 
                className="rounded-xl shadow-lg border-primary/20 font-bold px-6 bg-accent text-accent-foreground hover:bg-accent/80 transition-all"
              >
                <FileArchive className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>
            )}
            <Button 
              onClick={handleExportZip} 
              disabled={isExporting}
              className="rounded-xl shadow-lg shadow-primary/30 font-bold px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Packing ZIP ({exportProgress}%)...
                </>
              ) : (
                <>
                  <FileArchive className="h-4 w-4 mr-2" />
                  Export to ZIP
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Main Table Content */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <Table>
          <TableHeader className="bg-accent/30">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[50px] pl-6 py-5">
                <Checkbox 
                  checked={candidates.length > 0 && selectedIds.length === candidates.length} 
                  onCheckedChange={toggleSelectAll} 
                  aria-label="Select all"
                  className="translate-y-[2px]"
                />
              </TableHead>
              <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest pl-2">Candidate</TableHead>
              <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Employer</TableHead>
              <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-center">Status</TableHead>
              <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-center">Docs</TableHead>
              <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest pr-8 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((candidate: any) => (
              <TableRow key={candidate.id} className="hover:bg-accent/30 transition-colors border-accent/20">
                <TableCell className="pl-6 py-6">
                  <Checkbox 
                    checked={selectedIds.includes(candidate.id)} 
                    onCheckedChange={() => toggleSelect(candidate.id)} 
                    aria-label={`Select ${candidate.name}`}
                    className="translate-y-[2px]"
                  />
                </TableCell>
                <TableCell className="py-6 pl-2">
                  <div className="flex flex-col">
                      <span className="font-bold text-foreground text-sm">{candidate.name || "Anonymous Candidate"}</span>
                      <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">{candidate.employeeId || candidate.id}</span>
                  </div>
                </TableCell>
                <TableCell className="py-6 font-medium text-sm text-muted-foreground">{candidate.employer || "N/A"}</TableCell>
                <TableCell className="py-6 text-center">
                  <div className="flex justify-center">
                      <Badge 
                          variant="secondary"
                          className={`
                              font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider
                              ${candidate.status === "PENDING" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : 
                                candidate.status === "READY" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"}
                          `}
                      >
                        {candidate.status}
                      </Badge>
                  </div>
                </TableCell>
                <TableCell className="py-6 text-center">
                  <span className="text-sm font-bold text-foreground">
                      {candidate._count?.documents || candidate.documents?.length || 0} <span className="text-muted-foreground font-normal">/ 4</span>
                  </span>
                </TableCell>
                 <TableCell className="py-6 pr-8 text-right">
                  <div className="flex items-center justify-end gap-2">
                      <CopyButton token={candidate.token} />
                      {role === "ADMIN" && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-xl hover:bg-red-500/10 text-red-500 transition-all font-bold group"
                          onClick={() => handleDeleteClick(candidate.id, candidate.name || 'Anonymous Candidate')}
                          title="Delete Candidate"
                        >
                            <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </Button>
                      )}
                      <Link href={`/dashboard/candidate/${candidate.id}`}>
                      <Button variant="ghost" size="sm" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all font-bold group">
                          Details
                          <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                      </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {candidates.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center animate-in fade-in zoom-in duration-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                      <AlertCircle className="h-10 w-10 text-muted-foreground animate-bounce" />
                      <p className="text-muted-foreground font-bold tracking-tight">No submissions found yet.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Confirm Deletion"
        description={`Are you absolutely sure you want to permanently delete candidate ${candidateToDelete?.name}? This action cannot be undone.`}
        confirmText="Permanently Delete"
        variant="destructive"
      />

      <ConfirmationModal 
        isOpen={isBulkApproveModalOpen}
        onClose={() => setIsBulkApproveModalOpen(false)}
        onConfirm={handleBulkApprove}
        loading={isBulkApproving}
        title="Group Approval"
        description={`You are about to approve ${selectedIds.length} candidates. This will move them to 'READY' status and include them in synchronized reports.`}
        confirmText="Approve Selected"
        variant="success"
      />

      <ConfirmationModal 
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        onConfirm={() => setIsErrorModalOpen(false)}
        title="Operation Failed"
        description={errorMessage}
        confirmText="Understood"
        variant="destructive"
      />
    </div>
  );
}
