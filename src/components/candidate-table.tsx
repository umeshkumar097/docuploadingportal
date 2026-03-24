"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, ChevronRight, FileArchive, Loader2, Trash2, CheckCircle2, Search, Filter, Download } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { deleteCandidate } from "@/lib/actions/verification";
import * as XLSX from "xlsx";
import { ConfirmationModal } from "./confirmation-modal";
import { Input } from "@/components/ui/input";

interface CandidateTableProps {
  candidates: any[];
  masterData?: any[];
  role: string;
}

export function CandidateTable({ candidates, masterData = [], role }: CandidateTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<{id: string, name: string} | null>(null);
  
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"submitted" | "no-submit" | "login" | "outreach">("submitted");

  const uniquePhases = useMemo(() => {
    const phases = candidates.map(c => c.phase).filter(Boolean);
    return Array.from(new Set(phases)).sort();
  }, [candidates]);

  const uniqueCompanies = useMemo(() => {
    const companies = candidates.map(c => c.employer).filter(Boolean);
    return Array.from(new Set(companies)).sort();
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    if (activeTab === "outreach") {
      return masterData.filter((m: any) => {
        const q = searchQuery.toLowerCase();
        return (m.candidateName?.toLowerCase().includes(q)) || (m.employeeId?.toLowerCase().includes(q)) || (m.whatsappNumber?.includes(searchQuery));
      });
    }

    return candidates.filter((c: any) => {
      // Identity Category Filter
      const docCount = c._count?.documents ?? c.documents?.length ?? 0;
      const isSubmitted = c.status !== "PENDING" || docCount >= 4;
      const isNoSubmit = c.status === "PENDING" && docCount > 0 && docCount < 4;
      const isLogin = c.status === "PENDING" && docCount === 0 && (c.employeeId || c.name);

      if (activeTab === "submitted" && !isSubmitted) return false;
      if (activeTab === "no-submit" && !isNoSubmit) return false;
      if (activeTab === "login" && !isLogin) return false;

      // Other Filters
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        (c.name?.toLowerCase().includes(q)) ||
        (c.employeeId?.toLowerCase().includes(q)) ||
        (c.mobileNumber?.includes(searchQuery));
      
      const matchesCompany = companyFilter === "all" || c.employer === companyFilter;
      const matchesPhase = phaseFilter === "all" || c.phase === phaseFilter;
      
      return matchesSearch && matchesCompany && matchesPhase;
    });
  }, [candidates, masterData, searchQuery, companyFilter, phaseFilter, activeTab]);

  const handleDeleteClick = (id: string, name: string) => {
    setCandidateToDelete({ id, name });
    setIsDeleteModalOpen(true);
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
    if (selectedIds.length === filteredCandidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCandidates.map(c => c.id));
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
      const selectedCandidates = filteredCandidates.filter(c => selectedIds.includes(c.id));
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
    const candidatesToExport = selectedIds.length > 0 
      ? filteredCandidates.filter(c => selectedIds.includes(c.id))
      : filteredCandidates;

    const data = candidatesToExport.map(c => {
      const docStatus: any = {};
      c.documents?.forEach((doc: any) => {
        docStatus[doc.type] = doc.status;
      });

      const getFriendlyStatus = (status: string | undefined, typeLabel: string = "") => {
        if (!status) return "Not Uploaded";
        return typeLabel ? `Uploaded (${typeLabel})` : "Uploaded";
      };

      // Special handling for Aadhaar (Front/Back)
      let idProofFinal = getFriendlyStatus(docStatus["ID_PROOF"]);
      if (idProofFinal === "Not Uploaded" && (docStatus["ID_PROOF_FRONT"] || docStatus["ID_PROOF_BACK"])) {
        const primaryStatus = docStatus["ID_PROOF_FRONT"] || docStatus["ID_PROOF_BACK"];
        idProofFinal = getFriendlyStatus(primaryStatus, "Aadhaar");
      }

      return {
        "Registration Date": new Date(c.createdAt).toLocaleString(),
        "Candidate Name": c.name || "Anonymous",
        "Phase": c.phase || "Phase 1",
        "Employer": c.employer || "N/A",
        "Residential State": c.residentialState || "N/A",
        "Mobile": c.mobileNumber || "N/A",
        "Employee ID": c.employeeId || "N/A",
        "ID Type": c.idType || "N/A",
        "ID Number": c.idNumber || "N/A",
        "Photo": getFriendlyStatus(docStatus["PHOTO"]),
        "Qualification": getFriendlyStatus(docStatus["QUALIFICATION"]),
        "ID Proof": idProofFinal,
        "Signature": getFriendlyStatus(docStatus["SIGNATURE"]),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");
    
    // Set column widths
    const wscols = [
      { wch: 25 }, // Date
      { wch: 25 }, // Name
      { wch: 12 }, // Phase
      { wch: 20 }, // Employer
      { wch: 20 }, // State
      { wch: 15 }, // Mobile
      { wch: 15 }, // Emp ID
      { wch: 15 }, // ID Type
      { wch: 15 }, // Photo
      { wch: 15 }, // Qual
      { wch: 20 }, // ID Proof
      { wch: 15 }, // Sig
    ];
    worksheet["!cols"] = wscols;

    const filename = companyFilter !== "all" 
      ? `${companyFilter}-Report-${new Date().toISOString().split('T')[0]}.xlsx`
      : `Candidates-Report-${new Date().toISOString().split('T')[0]}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  return (    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 pb-2">
        <button
          onClick={() => setActiveTab("submitted")}
          className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === "submitted" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-accent/30 text-muted-foreground hover:bg-accent/50"}`}
        >
          Submitted ({candidates.filter(c => c.status !== "PENDING" || (c._count?.documents ?? c.documents?.length ?? 0) >= 4).length})
        </button>
        <button
          onClick={() => setActiveTab("no-submit")}
          className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === "no-submit" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-accent/30 text-muted-foreground hover:bg-accent/50"}`}
        >
          No Submit ({candidates.filter(c => c.status === "PENDING" && (c._count?.documents ?? c.documents?.length ?? 0) > 0 && (c._count?.documents ?? c.documents?.length ?? 0) < 4).length})
        </button>
        <button
          onClick={() => setActiveTab("login")}
          className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === "login" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-accent/30 text-muted-foreground hover:bg-accent/50"}`}
        >
          Login ({candidates.filter(c => c.status === "PENDING" && (c._count?.documents === 0 || c.documents?.length === 0) && (c.employeeId || c.name)).length})
        </button>
        <button
          onClick={() => setActiveTab("outreach")}
          className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === "outreach" ? "bg-pink-600 text-white shadow-lg shadow-pink-500/20" : "bg-accent/30 text-muted-foreground hover:bg-accent/50"}`}
        >
          Outreach ({masterData.length})
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between pb-2">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by Name, Emp ID, or Mobile..." 
            className="pl-10 h-12 rounded-2xl bg-accent/20 border-accent/30 focus:bg-background transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {role === "ADMIN" && (
            <div className="relative flex-1 md:flex-none">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                className="pl-10 pr-4 h-12 rounded-2xl bg-accent/20 border-accent/30 text-sm font-bold appearance-none hover:bg-accent/40 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 min-w-[200px]"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                <option value="all">All Companies</option>
                {uniqueCompanies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
          )}

          <div className="relative flex-1 md:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              className="pl-10 pr-4 h-12 rounded-2xl bg-accent/20 border-accent/30 text-sm font-bold appearance-none hover:bg-accent/40 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 min-w-[150px]"
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
            >
              <option value="all">All Phases</option>
              {uniquePhases.map(phase => (
                <option key={phase} value={phase}>{phase}</option>
              ))}
            </select>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleExportExcel}
            className="h-12 rounded-2xl px-6 font-bold border-accent/30 hover:bg-primary hover:text-primary-foreground transition-all gap-2"
          >
            <Download className="h-4 w-4" />
            Export Filtered Excel
          </Button>
        </div>
      </div>

      {/* Table Actions ToolBar */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border-2 border-primary/20 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-bottom-2 fade-in duration-300">
          <p className="font-bold text-primary ml-2">
            {selectedIds.length} candidate{selectedIds.length > 1 ? "s" : ""} selected for export
          </p>
          <div className="flex gap-2">
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
                  checked={filteredCandidates.length > 0 && selectedIds.length === filteredCandidates.length} 
                  onCheckedChange={toggleSelectAll} 
                  aria-label="Select all"
                  className="translate-y-[2px]"
                />
              </TableHead>
              <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest pl-2">Candidate</TableHead>
              <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">{activeTab === "outreach" ? "WhatsApp (Contact)" : "Employer"}</TableHead>
              <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-center">{activeTab === "outreach" ? "Category" : "Docs"}</TableHead>
              <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest pr-8 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCandidates.map((candidate: any) => (
              <TableRow key={candidate.id} className="hover:bg-accent/30 transition-colors border-accent/20">
                <TableCell className="pl-6 py-6">
                  <Checkbox 
                    checked={selectedIds.includes(candidate.id)} 
                    onCheckedChange={() => toggleSelect(candidate.id)} 
                    aria-label={`Select ${candidate.name || candidate.candidateName}`}
                    className="translate-y-[2px]"
                  />
                </TableCell>
                <TableCell className="py-6 pl-2">
                  <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">{candidate.name || candidate.candidateName || "Anonymous Candidate"}</span>
                        {candidate.phase && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/20 text-primary/70 font-bold uppercase tracking-tighter">
                            {candidate.phase}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">{candidate.employeeId || candidate.id}</span>
                  </div>
                </TableCell>
                <TableCell className="py-6 font-medium text-sm text-muted-foreground">
                  {activeTab === "outreach" ? (
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">{candidate.whatsappNumber || "N/A"}</span>
                      {candidate.whatsappNumber && (
                        <a href={`https://wa.me/91${candidate.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-emerald-500/10 rounded-md transition-colors">
                          <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.435 5.632 1.442h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </a>
                      )}
                    </div>
                  ) : (
                    candidate.employer || "N/A"
                  )}
                </TableCell>
                <TableCell className="py-6 text-center">
                  {activeTab === "outreach" ? (
                    <Badge variant="outline" className="text-[10px] border-amber-500/20 text-amber-600 bg-amber-500/5">
                      {candidate.candidateStatus || "Pending Outreach"}
                    </Badge>
                  ) : (
                    <span className="text-sm font-bold text-foreground">
                        {candidate._count?.documents || candidate.documents?.length || 0} <span className="text-muted-foreground font-normal">/ 4</span>
                    </span>
                  )}
                </TableCell>
                 <TableCell className="py-6 pr-8 text-right">
                  <div className="flex items-center justify-end gap-2">
                      {activeTab !== "outreach" ? (
                        <>
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
                        </>
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground uppercase italic tracking-tighter">Follow up required</span>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredCandidates.length === 0 && (
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
