"use client";

import { useState, useMemo, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, ChevronRight, FileArchive, Loader2, Trash2, CheckCircle2, Search, Filter, Download, Clock, Users, Database } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { deleteCandidate, bulkDeleteCandidates } from "@/lib/actions/verification";
import * as XLSX from "xlsx";
import { ConfirmationModal } from "./confirmation-modal";
import { Input } from "@/components/ui/input";

interface CandidateTableProps {
  candidates: any[];
  role: string;
  storageKeyPrefix?: string;
  isClientView?: boolean;
  hideSubTabs?: boolean;
}

export function CandidateTable({ candidates, role, storageKeyPrefix = "crux_", isClientView = false, hideSubTabs = false }: CandidateTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<{id: string, name: string} | null>(null);
  
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"submitted" | "no-submit" | "login">("submitted");
  const [trainingLanguageFilter, setTrainingLanguageFilter] = useState("all");
  const [qualificationTypeFilter, setQualificationTypeFilter] = useState("all");
  const [trainingMonthFilter, setTrainingMonthFilter] = useState<string>("all");

  const getEffectiveMonth = (c: any) => {
    return c.trainingMonth || new Date(c.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSearchQuery(sessionStorage.getItem(`${storageKeyPrefix}searchQuery`) || "");
      setCompanyFilter(sessionStorage.getItem(`${storageKeyPrefix}companyFilter`) || "all");
      setPhaseFilter(sessionStorage.getItem(`${storageKeyPrefix}phaseFilter`) || "all");
      setClientFilter(sessionStorage.getItem(`${storageKeyPrefix}clientFilter`) || "all");
      setDateFilter(sessionStorage.getItem(`${storageKeyPrefix}dateFilter`) || "");
      const savedTab = sessionStorage.getItem(`${storageKeyPrefix}activeTab`);
      if (savedTab) setActiveTab(savedTab as any);
      setTrainingLanguageFilter(sessionStorage.getItem(`${storageKeyPrefix}trainingLanguageFilter`) || "all");
      setQualificationTypeFilter(sessionStorage.getItem(`${storageKeyPrefix}qualificationTypeFilter`) || "all");
      
      const storedMonth = sessionStorage.getItem(`${storageKeyPrefix}trainingMonthFilter`);
      if (storedMonth) {
        setTrainingMonthFilter(storedMonth);
      } else if (candidates && candidates.length > 0) {
        const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
        const match = candidates.find((c: any) => getEffectiveMonth(c).toLowerCase().includes(currentMonthName.toLowerCase()));
        if (match) setTrainingMonthFilter(getEffectiveMonth(match));
        else setTrainingMonthFilter(getEffectiveMonth(candidates[0]));
      }
    }
  }, [candidates, storageKeyPrefix]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`${storageKeyPrefix}searchQuery`, searchQuery);
      sessionStorage.setItem(`${storageKeyPrefix}companyFilter`, companyFilter);
      sessionStorage.setItem(`${storageKeyPrefix}phaseFilter`, phaseFilter);
      sessionStorage.setItem(`${storageKeyPrefix}clientFilter`, clientFilter);
      sessionStorage.setItem(`${storageKeyPrefix}dateFilter`, dateFilter);
      sessionStorage.setItem(`${storageKeyPrefix}activeTab`, activeTab);
      sessionStorage.setItem(`${storageKeyPrefix}trainingLanguageFilter`, trainingLanguageFilter);
      sessionStorage.setItem(`${storageKeyPrefix}qualificationTypeFilter`, qualificationTypeFilter);
      sessionStorage.setItem(`${storageKeyPrefix}trainingMonthFilter`, trainingMonthFilter);
    }
  }, [searchQuery, companyFilter, phaseFilter, clientFilter, dateFilter, activeTab, trainingLanguageFilter, qualificationTypeFilter, trainingMonthFilter, storageKeyPrefix]);

  const uniquePhases = useMemo(() => {
    const phases = candidates.map(c => c.phase).filter(Boolean);
    const rawUnique = Array.from(new Set(phases)).sort();
    const hasBatches = rawUnique.some(p => p.toLowerCase().includes("batch"));
    if (hasBatches) {
      // Hide any legacy "Phase" entries (e.g. "Phase 1 August", "June Phase 5") when batch data exists
      return rawUnique.filter(p => !p.toLowerCase().includes("phase"));
    }
    return rawUnique;
  }, [candidates]);

  const uniqueCompanies = useMemo(() => {
    const companies = candidates.map(c => c.employer).filter(Boolean);
    return Array.from(new Set(companies)).sort();
  }, [candidates]);

  const uniqueClients = useMemo(() => {
    const clients = candidates.map(c => c.client?.name).filter(Boolean);
    return Array.from(new Set(clients)).sort();
  }, [candidates]);

  const uniqueTrainingMonths = useMemo(() => {
    const months = candidates.map(c => getEffectiveMonth(c)).filter(Boolean);
    const allMonths = Array.from(new Set(months)).sort();
    // Only show current month (August 2026) — hide all older months
    const currentMonth = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
    return allMonths.filter(m => (m as string) === currentMonth);
  }, [candidates]);

  // Fixed list of 9 languages — shown for ALL clients regardless of candidate data
  const ALL_TRAINING_LANGUAGES = [
    "Bengali", "English", "Gujarati", "Hindi",
    "Kannada", "Malayalam", "Marathi", "Tamil", "Telugu"
  ];

  // Fixed 2 qualification options
  const QUALIFICATION_OPTIONS = [
    { value: "GRADUATE", label: "Graduate" },
    { value: "UNDERGRADUATE", label: "Undergraduate" },
  ];

  // Normalize any qualification value to GRADUATE or UNDERGRADUATE
  const normalizeQual = (q: string): string => {
    const upper = (q || "").toUpperCase().replace(/[\s_-]+/g, '');
    if (
      upper.includes('UNDER') ||
      upper.includes('10TH') ||
      upper.includes('12TH') ||
      upper.includes('TWELFTH') ||
      upper.includes('TENTH') ||
      upper.includes('DIPLOMA') ||
      upper === 'UG' ||
      upper.includes('HIGHSCHOOL') ||
      upper.includes('SECONDARY')
    ) return 'UNDERGRADUATE';
    return 'GRADUATE'; // Graduate, Bachelor of *, Master of *, PG, etc.
  };

  const filteredForStats = useMemo(() => {
    return candidates.filter((c: any) => {
      // Other Filters
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        (c.name?.toLowerCase().includes(q)) ||
        (c.employeeId?.toLowerCase().includes(q)) ||
        (c.mobileNumber?.includes(searchQuery));
      
      const matchesCompany = companyFilter === "all" || c.employer === companyFilter;
      const matchesPhase = phaseFilter === "all" || c.phase === phaseFilter;
      const matchesClient = clientFilter === "all" || c.client?.name === clientFilter;
      const matchesMonth = trainingMonthFilter === "all" || getEffectiveMonth(c) === trainingMonthFilter;
      const matchesLanguage = trainingLanguageFilter === "all" || c.trainingLanguage === trainingLanguageFilter;
      const matchesQualification = qualificationTypeFilter === "all" ||
        normalizeQual(c.qualificationType || '') === qualificationTypeFilter.toUpperCase();
      
      let matchesDate = true;
      if (dateFilter) {
        const cDate = new Date(c.createdAt).toISOString().split('T')[0];
        matchesDate = cDate === dateFilter;
      }
      
      return matchesSearch && matchesCompany && matchesPhase && matchesClient && matchesMonth && matchesDate && matchesLanguage && matchesQualification;
    });
  }, [candidates, searchQuery, companyFilter, phaseFilter, clientFilter, trainingMonthFilter, dateFilter, trainingLanguageFilter, qualificationTypeFilter]);

  const filteredCandidates = useMemo(() => {
    return filteredForStats.filter((c: any) => {
      // Identity Category Filter
      const isDra = c.isDraCertified;
      const docs = c.documents || [];
      const docCount = isDra 
        ? docs.filter((d: any) => d.type === "DRA_CERTIFICATE" && d.status !== "REJECTED").length
        : docs.filter((d: any) => d.type !== "DRA_CERTIFICATE" && d.status !== "REJECTED").length;
      
      const isSubmitted = c.status !== "ON_HOLD" && (c.status === "READY" || c.status === "TRAINED" || (isDra ? docCount >= 1 : docCount >= 4));
      const isNoSubmit = c.status === "PENDING" && docCount > 0 && (isDra ? docCount < 1 : docCount < 4);
      
      // Login: Status PENDING, No Docs for their mode, has name/ID, and active in last 30 minutes
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
      const lastActive = new Date(c.lastActiveAt || c.createdAt);
      const isActive = lastActive > thirtyMinsAgo;
      const isLogin = c.status === "PENDING" && docCount === 0 && (c.name || c.employeeId) && isActive;

      if (!hideSubTabs) {
        if (activeTab === "submitted" && !isSubmitted) return false;
        if (activeTab === "no-submit" && !isNoSubmit) return false;
        if (activeTab === "login" && !isLogin) return false;
      }

      return true;
    });
  }, [filteredForStats, activeTab]);

  const stats = useMemo(() => {
    const submittedCount = filteredForStats.filter((c: any) => {
      const isDra = c.isDraCertified;
      const docs = c.documents || [];
      const docCount = isDra 
        ? docs.filter((d: any) => d.type === "DRA_CERTIFICATE" && d.status !== "REJECTED").length
        : docs.filter((d: any) => d.type !== "DRA_CERTIFICATE" && d.status !== "REJECTED").length;
      return c.status !== "ON_HOLD" && (c.status === "READY" || c.status === "TRAINED" || (isDra ? docCount >= 1 : docCount >= 4));
    }).length;

    const partialCount = filteredForStats.filter((c: any) => {
      const isDra = c.isDraCertified;
      const docs = c.documents || [];
      const docCount = isDra 
        ? docs.filter((d: any) => d.type === "DRA_CERTIFICATE" && d.status !== "REJECTED").length
        : docs.filter((d: any) => d.type !== "DRA_CERTIFICATE" && d.status !== "REJECTED").length;
      return c.status === "PENDING" && docCount > 0 && (isDra ? docCount < 1 : docCount < 4);
    }).length;

    const loginOnlyCount = filteredForStats.filter((c: any) => {
      const isDra = c.isDraCertified;
      const docs = c.documents || [];
      const docCount = isDra 
        ? docs.filter((d: any) => d.type === "DRA_CERTIFICATE" && d.status !== "REJECTED").length
        : docs.filter((d: any) => d.type !== "DRA_CERTIFICATE" && d.status !== "REJECTED").length;
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
      const lastActive = new Date(c.lastActiveAt || c.createdAt);
      const isActive = lastActive > thirtyMinsAgo;
      return c.status === "PENDING" && docCount === 0 && (c.name || c.employeeId) && isActive;
    }).length;

    return [
      { label: "Submitted", value: submittedCount, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
      { label: "Partial (No Submit)", value: partialCount, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
      { label: "Identified (Login)", value: loginOnlyCount, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" }
    ];
  }, [filteredForStats]);

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

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    setIsDeleting(true);
    try {
      await bulkDeleteCandidates(selectedIds);
      setIsBulkDeleteModalOpen(false);
      setSelectedIds([]);
    } catch (err: any) {
      console.error(err);
      setIsBulkDeleteModalOpen(false);
      setErrorMessage(err.message || "Failed to delete selected candidates.");
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

      // Helper: "EmployeeID" — safe for folder names
      const getCandidateLabel = (c: any) => {
        return c.employeeId || c.id;
      };

      const masterZipName = isSingle 
        ? `${getCandidateLabel(selectedCandidates[0])}.zip`
        : `Export-${new Date().toISOString().split('T')[0]}.zip`;

      for (const candidate of selectedCandidates) {
        const candidateIdentifier = getCandidateLabel(candidate);
        const candidateFolder = isSingle ? zip : zip.folder(candidateIdentifier);
        
        if (!candidate.documents || !candidateFolder) continue;

        for (const doc of candidate.documents) {
          try {
            const res = await fetch(`/api/export/proxy?url=${encodeURIComponent(doc.fileUrl)}`);
            if (!res.ok) throw new Error("Proxy fetch failed");
            
            const blob = await res.blob();
            const urlParts = doc.fileUrl.split('.');
            const ext = urlParts.length > 1 ? urlParts.pop() : "jpg";
            const fileName = `${doc.type}.${ext}`;
            candidateFolder.file(fileName, blob);
            
            filesFetched++;
            setExportProgress(Math.round((filesFetched / totalFilesToFetch) * 100));
          } catch (err) {
            console.error(`Failed to fetch ${doc.type} for ${candidateIdentifier}`, err);
          }
        }

        // Nested ZIP generation removed - documents are now placed directly in folders
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

    // Sort chronologically (oldest first) so Excel rows are in proper order of registration
    const sortedCandidates = [...candidatesToExport].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const data = sortedCandidates.map(c => {
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

      const row: any = {
        "Registration Date": new Date(c.createdAt).toISOString().replace('T', ' ').substring(0, 19),
        "Candidate Name": c.name || "Anonymous",
        "Phase": c.phase || "Phase 1",
        "Employer": c.employer || "N/A",
        "Address Line 1": c.addressLine1 || "N/A",
        "Address Line 2": c.addressLine2 || "N/A",
        "City": c.city || "N/A",
        "Residential State": c.residentialState || "N/A",
        "Pincode": c.pincode || "N/A",
        "Mobile": c.mobileNumber || "N/A",
        "Email": c.email || "N/A",
        "Employee ID": c.employeeId || "N/A",
        "Date of Birth": c.dob || "N/A",
        "ID Type": c.idType || "N/A",
        "ID Number": c.idNumber || "N/A",
        "Photo": getFriendlyStatus(docStatus["PHOTO"]),
        "Master Data Category": c.qualificationType || "N/A",
        "Selected Qualification": c.highestQualification || "N/A",
        "Qual Document": getFriendlyStatus(docStatus["QUALIFICATION"]),
        "ID Proof": idProofFinal,
        "Signature": getFriendlyStatus(docStatus["SIGNATURE"]),
      };

      // Append all available Master Data columns
      if (c.masterData) {
        const md = c.masterData;
        const skipKeys = ['id', 'createdAt', 'updatedAt', 'clientId', 'employeeId'];
        Object.keys(md).forEach(key => {
          if (!skipKeys.includes(key) && md[key] !== null && md[key] !== undefined && md[key] !== '') {
            const formattedKey = "MD_" + key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase());
            if (row[formattedKey] === undefined) {
                row[formattedKey] = md[key];
            }
          }
        });
      }

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");
    
    // Let Excel auto-size columns by not setting wscols explicitly since columns are now dynamic
    // We removed the static wscols array because master data columns can vary
    
    const filename = companyFilter !== "all"  
      ? `${companyFilter}-Report-${new Date().toISOString().split('T')[0]}.xlsx`
      : `Candidates-Report-${new Date().toISOString().split('T')[0]}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      {!hideSubTabs ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat: any, i: number) => (
          <div key={i} className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} w-fit mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-black text-foreground">{stat.value}</h3>
            </div>
          </div>
        ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <div className={`p-3 rounded-2xl bg-primary/10 text-primary w-fit mb-4 group-hover:scale-110 transition-transform`}>
              <Users className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Candidates</p>
              <h3 className="text-3xl font-black text-foreground">{filteredCandidates.length}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      {!hideSubTabs && (
        <div className="flex flex-wrap gap-2 pb-2">
        <button
          onClick={() => setActiveTab("submitted")}
          className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === "submitted" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-accent/30 text-muted-foreground hover:bg-accent/50"}`}
        >
          Submitted ({stats[0].value})
        </button>
        <button
          onClick={() => setActiveTab("no-submit")}
          className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === "no-submit" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-accent/30 text-muted-foreground hover:bg-accent/50"}`}
        >
          No Submit ({stats[1].value})
        </button>
        <button
          onClick={() => setActiveTab("login")}
          className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === "login" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-accent/30 text-muted-foreground hover:bg-accent/50"}`}
        >
          Login ({stats[2].value})
        </button>
      </div>
      )}

      {/* Search and Filter - Dedicated Prominent Row */}
      <div className="relative group max-w-2xl">
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 h-11 w-11 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 z-10 transition-transform group-focus-within:scale-105">
          <Search className="h-5 w-5 text-primary-foreground" />
        </div>
        <Input 
          placeholder="Search candidates by Name, Employee ID, or Mobile Number..." 
          className="pl-16 h-14 rounded-2xl bg-background border-2 border-primary/5 shadow-sm focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all text-base font-medium placeholder:text-muted-foreground/60"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors font-bold text-xs uppercase tracking-widest"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-start pb-2">
        <div className="flex flex-wrap items-center gap-3 w-full">
          {role === "ADMIN" && !isClientView && (
            <div className="relative flex-1 min-w-[180px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                className="pl-10 pr-4 h-12 rounded-2xl bg-accent/20 border-accent/30 text-sm font-bold appearance-none hover:bg-accent/40 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 w-full"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                <option value="all">All Companies</option>
                {uniqueCompanies.map(company => (
                  <option key={company} value={company as string}>{company as string}</option>
                ))}
              </select>
            </div>
          )}

          {role === "ADMIN" && !isClientView && (
            <div className="relative flex-1 min-w-[200px] hidden xl:block">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                className="pl-10 pr-4 h-12 rounded-2xl bg-accent/20 border-accent/30 text-sm font-bold appearance-none hover:bg-accent/40 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 w-full"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <option value="all">All Links (Clients)</option>
                {uniqueClients.map(clientName => (
                  <option key={clientName as string} value={clientName as string}>{clientName as string}</option>
                ))}
              </select>
            </div>
          )}

          <div className="relative flex-1 min-w-[140px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              className="pl-10 pr-4 h-12 rounded-2xl bg-accent/20 border-accent/30 text-sm font-bold appearance-none hover:bg-accent/40 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 w-full"
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
            >
              <option value="all">
                {uniquePhases.some(p => p.toLowerCase().includes("batch")) ? "All Batches" : "All Phases"}
              </option>
              {uniquePhases.map(phase => (
                <option key={phase} value={phase}>{phase}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 min-w-[160px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              className="pl-10 pr-4 h-12 rounded-2xl bg-accent/20 border-accent/30 text-sm font-bold appearance-none hover:bg-accent/40 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 w-full"
              value={trainingMonthFilter}
              onChange={(e) => setTrainingMonthFilter(e.target.value)}
            >
              <option value="all">All Months</option>
              {uniqueTrainingMonths.map(month => (
                <option key={month as string} value={month as string}>{month as string}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 min-w-[160px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              className="pl-10 pr-4 h-12 rounded-2xl bg-accent/20 border-accent/30 text-sm font-bold appearance-none hover:bg-accent/40 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 w-full"
              value={trainingLanguageFilter}
              onChange={(e) => setTrainingLanguageFilter(e.target.value)}
            >
              <option value="all">All Languages</option>
              {ALL_TRAINING_LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 min-w-[160px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              className="pl-10 pr-4 h-12 rounded-2xl bg-accent/20 border-accent/30 text-sm font-bold appearance-none hover:bg-accent/40 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 w-full"
              value={qualificationTypeFilter}
              onChange={(e) => setQualificationTypeFilter(e.target.value)}
            >
              <option value="all">All Qualifications</option>
              {QUALIFICATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 min-w-[140px]">
            <Input 
              type="date"
              className="h-12 rounded-2xl bg-accent/20 border-accent/30 focus:bg-background transition-all text-sm font-bold text-muted-foreground appearance-none w-full cursor-pointer"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              title="Filter by submission date"
            />
            {dateFilter && (
              <button 
                onClick={() => setDateFilter("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-red-500"
              >
                Clear
              </button>
            )}
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleExportExcel}
            className="h-12 rounded-2xl px-6 font-bold border-accent/30 hover:bg-primary hover:text-primary-foreground transition-all gap-2"
          >
            <Download className="h-4 w-4" />
            Excel
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
                onClick={() => setIsBulkDeleteModalOpen(true)} 
                variant="destructive"
                className="rounded-xl shadow-lg font-bold px-6 border-0 hover:bg-destructive/90 transition-all flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Bulk Delete
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
                  checked={filteredCandidates.length > 0 && selectedIds.length === filteredCandidates.length} 
                  onCheckedChange={toggleSelectAll} 
                  aria-label="Select all"
                  className="translate-y-[2px]"
                />
              </TableHead>
              <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest pl-2">Candidate</TableHead>
              <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Timeline</TableHead>
              <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Employer</TableHead>
              <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-center">Docs</TableHead>
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
                <TableCell className="py-5">
                  <div className="flex flex-col gap-1 items-start">
                    {candidate.phase && (
                      <Badge variant="outline" className="text-[9px] px-2 py-0.5 border-primary/20 text-primary font-bold uppercase tracking-widest bg-primary/5 rounded-lg w-fit">
                        {candidate.phase}
                      </Badge>
                    )}
                    {candidate.trainingMonth && (
                      <Badge variant="outline" className="text-[9px] px-2 py-0.5 border-amber-500/20 text-amber-600 font-bold uppercase tracking-widest bg-amber-500/5 rounded-lg w-fit">
                        {candidate.trainingMonth}
                      </Badge>
                    )}
                    {(candidate.highestQualification || candidate.qualificationType) && (
                      <Badge variant="outline" className={`text-[9px] px-2 py-0.5 border-2 font-black uppercase tracking-widest rounded-lg w-fit ${(candidate.highestQualification || candidate.qualificationType) === 'GRADUATE' ? 'border-emerald-500/20 text-emerald-600 bg-emerald-500/5' : 'border-indigo-500/20 text-indigo-600 bg-indigo-500/5'}`}>
                        {candidate.highestQualification || candidate.qualificationType}
                      </Badge>
                    )}
                    {candidate.isDraCertified && (
                      <Badge variant="outline" className="text-[9px] px-2 py-0.5 border-blue-500/20 text-blue-600 font-bold uppercase tracking-widest bg-blue-500/5 rounded-lg w-fit">
                        DRA Certified
                      </Badge>
                    )}
                    {!candidate.phase && !candidate.trainingMonth && (
                      <span className="text-[10px] text-muted-foreground italic font-medium">N/A</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-6 font-medium text-sm text-muted-foreground">{candidate.employer || "N/A"}</TableCell>
                <TableCell className="py-6 text-center">
                  <span className="text-sm font-bold text-foreground">
                      {candidate.isDraCertified 
                        ? (candidate.documents?.filter((d: any) => d.type === "DRA_CERTIFICATE" && d.status !== "REJECTED").length || 0)
                        : (candidate.documents?.filter((d: any) => d.type !== "DRA_CERTIFICATE" && d.status !== "REJECTED").length || 0)
                      } 
                      <span className="text-muted-foreground font-normal"> / {candidate.isDraCertified ? "1" : "4"}</span>
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
            {filteredCandidates.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center animate-in fade-in zoom-in duration-500">
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
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        loading={isDeleting}
        title="Confirm Bulk Deletion"
        description={`Are you absolutely sure you want to permanently delete ${selectedIds.length} candidates? This action cannot be undone.`}
        confirmText="Bulk Delete Candidates"
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
