"use client";

import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  Download, 
  Loader2, 
  MapPin, 
  Search,
  Power,
  RefreshCw,
  AlertCircle,
  Building2,
  CheckCircle2,
  UserPlus,
  Truck,
  RefreshCcw
} from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { BookRecipientUpload } from "@/components/book-recipient-upload";
import { DispatchedUpload } from "@/components/dispatched-upload";
import { ResetSubmissionUpload } from "@/components/reset-submission-upload";
import { toast } from "sonner";

interface AddressRecord {
  id: string;
  employeeId: string;
  phoneNumber?: string;
  name?: string;
  officeMobileNo?: string;
  personalMobileNo?: string;
  whatsappNo?: string;
  companyAgency?: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  city: string;
  state: string;
  pincode: string;
  bookLanguage: string;
  createdAt: string;
  updatedAt?: string;
}

interface PendingRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  state?: string;
  reportingManagerId?: string;
  reportingManagerName?: string;
  reportingManagerGroup?: string;
  skipLevelManagerId?: string;
  skipLevelManagerName?: string;
  activeStatus?: string;
  email?: string;
  officeMobileNo?: string;
  personalMobileNo?: string;
  whatsappNo?: string;
  vendor?: string;
  phase?: string;
  region2?: string;
  location2?: string;
  city?: string;
  pincode?: string;
  draBatch?: string;
}

interface DispatchedRecord {
  employeeId: string;
  name: string;
  vendor: string;
  officeMobileNo?: string;
  personalMobileNo?: string;
  address: string;
  dispatchedAt: string;
}

export default function AddressManagementPage() {
  const [records, setRecords] = useState<AddressRecord[]>([]);
  const [pendingRecords, setPendingRecords] = useState<PendingRecord[]>([]);
  const [dispatchedRecords, setDispatchedRecords] = useState<DispatchedRecord[]>([]);
  const [totalMaster, setTotalMaster] = useState(0);
  const [view, setView] = useState<"submissions" | "pending" | "dispatched">("submissions");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormEnabled, setIsFormEnabled] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDispatchedUploadOpen, setIsDispatchedUploadOpen] = useState(false);
  const [isResetUploadOpen, setIsResetUploadOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchData();
    fetchFormStatus();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dashboard/addresses");
      const data = await res.json();
      if (data.records) {
        setRecords(data.records);
        setPendingRecords(data.pending || []);
        setDispatchedRecords(data.dispatched || []);
        setTotalMaster(data.totalMaster || 0);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchFormStatus() {
    try {
      const res = await fetch("/api/settings/form-status");
      const data = await res.json();
      setIsFormEnabled(data.enabled);
    } catch (error) {}
  }

  async function toggleFormStatus() {
    setIsToggling(true);
    try {
      const res = await fetch("/api/settings/form-status", {
        method: "PATCH",
        body: JSON.stringify({ enabled: !isFormEnabled }),
      });
      if (res.ok) {
        setIsFormEnabled(!isFormEnabled);
        setMessage({ type: "success", text: `Form successfully ${!isFormEnabled ? "Enabled" : "Disabled"}` });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to toggle form status" });
    } finally {
      setIsToggling(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    if (view === "submissions") {
      const currentIds = records.map(r => r.id);
      setSelectedIds(prev => (prev.length === currentIds.length ? [] : currentIds));
    } else if (view === "pending") {
      const currentIds = pendingRecords.map(r => r.employeeId);
      setSelectedIds(prev => (prev.length === currentIds.length ? [] : currentIds));
    } else {
      const currentIds = dispatchedRecords.map(r => r.employeeId);
      setSelectedIds(prev => (prev.length === currentIds.length ? [] : currentIds));
    }
  }

  async function handleDelete(id: string | string[], type: 'address' | 'master' | 'dispatched' = 'address') {
    if (!confirm(`Are you sure you want to delete this record from the ${type} list?`)) return;

    try {
      const endpoint = type === 'address' 
        ? `/api/dashboard/addresses?id=${Array.isArray(id) ? id.join(',') : id}`
        : type === 'master'
        ? `/api/dashboard/book-master/delete?id=${id}`
        : `/api/dashboard/book-dispatched/delete?employeeId=${id}`;

      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        toast.success("Record deleted successfully");
        fetchData();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast.error("Failed to delete record");
    }
  }

  function exportToExcel() {
    const selectedData = records.filter(r => selectedIds.includes(r.id));
    const dataToExport = selectedData.map(r => ({
      "Employee Id": r.employeeId,
      "Employee Name": r.name || "N/A",
      "Office Mobile No": r.officeMobileNo || "N/A",
      "Personal Mobile No": r.personalMobileNo || "N/A",
      "Whatsapp No": r.whatsappNo || "N/A",
      "Full Address": [r.addressLine1, r.addressLine2, r.addressLine3].filter(Boolean).join(", "),
      "City": r.city,
      "State": r.state,
      "Pincode": r.pincode,
      "Book Language": r.bookLanguage || "English",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Addresses");
    XLSX.writeFile(workbook, `AddressRecords_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
  }

  function exportPendingToExcel() {
    const dataToExport = pendingRecords.map(r => ({
      "Employee Id": r.employeeId,
      "Employee Name": r.employeeName || "",
      "State": r.state || "",
      "Reporting Manager ID": r.reportingManagerId || "",
      "Reporting Manager Name": r.reportingManagerName || "",
      "Reporting Manager Group": r.reportingManagerGroup || "",
      "Skip Level Manager ID": r.skipLevelManagerId || "",
      "Skip Level Manager Name": r.skipLevelManagerName || "",
      "Active Status": r.activeStatus || "",
      "Email": r.email || "",
      "Office Mobile No": r.officeMobileNo || "",
      "Personal Mobile No": r.personalMobileNo || "",
      "Whatsapp No": r.whatsappNo || "",
      "Vendor": r.vendor || "",
      "Phase": r.phase || "Phase 1",
      "Region 2": r.region2 || "",
      "Location2": r.location2 || "",
      "City": r.city || "",
      "Pincode": r.pincode || "",
      "DRA Batch": r.draBatch || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pending_Recipients");
    XLSX.writeFile(workbook, `Pending_Recipients_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header & Status Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
            <MapPin className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Address Vault</h1>
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-[0.2em]">Manage Secure Submissions</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <Button 
                onClick={() => setIsUploadOpen(true)}
                className="rounded-[1.5rem] h-12 px-6 font-bold flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
            >
                <UserPlus className="h-4 w-4" />
                Upload Recipient List
            </Button>

            <Button 
                onClick={() => setIsResetUploadOpen(true)}
                variant="outline"
                className="h-12 rounded-[1.5rem] font-bold gap-2 px-6 border-orange-200 hover:bg-orange-50 hover:text-orange-600 transition-all"
            >
                <RefreshCcw className="h-4 w-4" />
                Reset Incomplete
            </Button>

            <Button 
                onClick={() => setIsDispatchedUploadOpen(true)}
                className="rounded-[1.5rem] h-12 px-6 font-bold flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
            >
                <Truck className="h-4 w-4" />
                Upload Sent List
            </Button>

            <div className="flex items-center gap-4 bg-card border rounded-[2rem] p-2 pl-6 shadow-sm">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Public Form Status</span>
                    <span className={`text-xs font-bold uppercase ${isFormEnabled ? "text-emerald-500" : "text-rose-500"}`}>
                        {isFormEnabled ? "ONLINE & ACCEPTING" : "OFFLINE & LOCKED"}
                    </span>
                </div>
                <Button 
                    variant={isFormEnabled ? "outline" : "default"}
                    onClick={toggleFormStatus}
                    disabled={isToggling}
                    className={`rounded-[1.5rem] h-12 px-6 font-bold flex items-center gap-3 transition-all ${isFormEnabled ? "hover:bg-rose-500/10 hover:text-rose-600 border-emerald-500/20" : "bg-emerald-600 hover:bg-emerald-500 text-white"}`}
                >
                    {isToggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                    {isFormEnabled ? "Deactivate" : "Activate"}
                </Button>
            </div>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
         <div className="bg-card border rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <MapPin className="h-20 w-20" />
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground mb-1">Total Recipients</span>
            <div className="flex items-end gap-2">
                <span className="text-4xl font-black tracking-tighter text-foreground">{totalMaster}</span>
                <span className="text-xs font-bold text-blue-500 mb-1.5 flex items-center gap-1 uppercase">
                   Target
                </span>
            </div>
         </div>

         <div className="bg-card border rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-20 w-20" />
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground mb-1">Address Collected</span>
            <div className="flex items-end gap-2">
                <span className="text-4xl font-black tracking-tighter text-foreground">{records.length}</span>
                <span className="text-xs font-bold text-emerald-500 mb-1.5 flex items-center gap-1 uppercase">
                   Ready
                </span>
            </div>
         </div>

         <div className="bg-card border rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <Truck className="h-20 w-20" />
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground mb-1">Books Shipped</span>
            <div className="flex items-end gap-2">
                <span className="text-4xl font-black tracking-tighter text-emerald-600">{dispatchedRecords.length}</span>
                <span className="text-xs font-bold text-emerald-600 mb-1.5 flex items-center gap-1 uppercase">
                   Sent
                </span>
            </div>
         </div>
         
         <div className="bg-card border rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <AlertCircle className="h-20 w-20" />
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground mb-1">Pending Address</span>
            <div className="flex items-end gap-2">
                <span className="text-4xl font-black tracking-tighter text-rose-500">{pendingRecords.length}</span>
                <span className="text-xs font-bold text-rose-500 mb-1.5 flex items-center gap-1 uppercase">
                   Missing
                </span>
            </div>
         </div>
      </div>

      {/* View Toggle & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 p-1 bg-muted rounded-2xl w-fit">
              <Button 
                variant={view === "submissions" ? "default" : "ghost"}
                onClick={() => setView("submissions")}
                className="rounded-xl h-10 px-6 font-bold transition-all"
              >
                Submissions ({records.length})
              </Button>
              <Button 
                variant={view === "pending" ? "default" : "ghost"}
                onClick={() => setView("pending")}
                className="rounded-xl h-10 px-6 font-bold transition-all"
              >
                Pending ({pendingRecords.length})
              </Button>
              <Button 
                variant={view === "dispatched" ? "default" : "ghost"}
                onClick={() => setView("dispatched")}
                className="rounded-xl h-10 px-6 font-bold transition-all"
              >
                Sent / Dispatched ({dispatchedRecords.length})
              </Button>
          </div>

          {view === "pending" && (
            <Button 
              onClick={exportPendingToExcel}
              className="rounded-2xl h-12 px-8 font-black flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 shadow-xl shadow-foreground/10 border-t border-white/10"
            >
              <Download className="h-4 w-4" />
              Download Pending List (Excel)
            </Button>
          )}
      </div>

      {/* Floating Toolbar */}
      {selectedIds.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-foreground/95 backdrop-blur-xl border border-white/10 rounded-full px-8 py-4 shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom duration-300">
             <div className="flex items-center gap-3 pr-8 border-r border-white/20">
                <span className="text-background font-black text-lg">{selectedIds.length}</span>
                <span className="text-white/60 font-bold uppercase text-[10px] tracking-widest">Selected</span>
             </div>
             
             <div className="flex items-center gap-4">
                <Button 
                    onClick={exportToExcel}
                    className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-full px-6 h-11 flex items-center gap-2 border-0"
                >
                    <Download className="h-4 w-4" /> Export Excel
                </Button>
                <Button 
                    onClick={() => handleDelete(selectedIds, view === 'submissions' ? 'address' : view === 'pending' ? 'master' : 'dispatched')}
                    variant="destructive"
                    className="font-bold rounded-full px-6 h-11 flex items-center gap-2"
                >
                    <Trash2 className="h-4 w-4" /> Delete Records
                </Button>
                <Button 
                    variant="ghost" 
                    onClick={() => setSelectedIds([])}
                    className="text-white/60 hover:text-white hover:bg-white/10 rounded-full h-11 px-6 font-bold"
                >
                    Cancel
                </Button>
             </div>
          </div>
      )}

      {/* Data Table */}
      <div className="bg-card border rounded-[2.5rem] overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="w-14 p-6">
                <Checkbox 
                  checked={(() => {
                    const currentList = view === "submissions" ? records : view === "pending" ? pendingRecords : dispatchedRecords;
                    return selectedIds.length === currentList.length && currentList.length > 0;
                  })()}
                  onCheckedChange={toggleAll}
                  className="rounded-lg h-5 w-5"
                />
              </TableHead>
              <TableHead className="p-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground whitespace-nowrap">Employee Info</TableHead>
              <TableHead className="p-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground whitespace-nowrap">Organisation</TableHead>
              <TableHead className="p-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground whitespace-nowrap">Language</TableHead>
              <TableHead className="p-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground whitespace-nowrap">Address Details</TableHead>
              <TableHead className="p-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground whitespace-nowrap text-right">Submitted At</TableHead>
              <TableHead className="p-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(() => {
              if (isLoading) {
                return (
                  <TableRow>
                    <TableCell colSpan={7} className="p-20 text-center">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-muted-foreground/30 mb-4" />
                      <span className="font-bold text-muted-foreground/50 uppercase tracking-widest text-xs">Deciphering Records...</span>
                    </TableCell>
                  </TableRow>
                );
              }

              if (view === "submissions") {
                return records.map((record) => (
                  <TableRow key={record.id} className="group hover:bg-accent/30 transition-colors border-b last:border-0 h-24">
                    <TableCell className="p-6">
                      <Checkbox checked={selectedIds.includes(record.id)} onCheckedChange={() => toggleSelect(record.id)} className="rounded-lg h-5 w-5" />
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground truncate max-w-[200px]">{record.name || "N/A"}</span>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-wider mt-1">
                          <span className="text-primary/60">{record.employeeId}</span>
                          <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          <span>{record.personalMobileNo || "N/A"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                        <span className="text-sm font-semibold truncate max-w-[150px]">{record.companyAgency || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                        {record.bookLanguage || "English"}
                      </span>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-foreground truncate max-w-[300px]">{record.addressLine1}</span>
                        <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest mt-1">
                          {record.city}, {record.state} &middot; {record.pincode}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-foreground/80 leading-none mb-1">
                          {format(new Date(record.createdAt), "dd MMM yyyy")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="p-6 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(record.id, 'address')}
                        className="text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-colors rounded-xl"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ));
              }

              if (view === "pending") {
                if (pendingRecords.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={6} className="p-20 text-center">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500/20 mx-auto mb-6" />
                        <span className="font-bold text-muted-foreground/30 uppercase tracking-widest text-xs">All employees have submitted!</span>
                      </TableCell>
                    </TableRow>
                  );
                }
                return pendingRecords.map((item) => (
                  <TableRow key={item.employeeId} className="group hover:bg-rose-50/20 transition-colors border-b last:border-0 h-24">
                    <TableCell className="p-6">
                      <Checkbox checked={selectedIds.includes(item.employeeId)} onCheckedChange={() => toggleSelect(item.employeeId)} className="rounded-lg h-5 w-5" />
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground/80">{item.employeeName}</span>
                        <span className="text-[10px] font-black uppercase text-primary/40 tracking-[0.2em] mt-1">{item.employeeId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                        <span className="text-sm font-semibold text-muted-foreground">{item.vendor || "Not Configured"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex flex-col gap-1.5">
                        {item.officeMobileNo && (
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-500 uppercase tracking-tighter">OFFICE</span>
                            <span className="text-xs font-bold text-foreground/60">{item.officeMobileNo}</span>
                          </div>
                        )}
                        {item.personalMobileNo && (
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-500 uppercase tracking-tighter">MOBILE</span>
                            <span className="text-xs font-bold text-foreground/60">{item.personalMobileNo}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-6" colSpan={2}>
                      <div className="flex items-center gap-3 text-rose-500 bg-rose-500/5 px-4 py-2.5 rounded-2xl border border-rose-500/10 w-fit">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.1em]">Pending Campaign Record</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ));
              }

              if (view === "dispatched") {
                if (dispatchedRecords.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={6} className="p-20 text-center">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Truck className="h-10 w-10 text-emerald-500/20" />
                        </div>
                        <span className="font-bold text-muted-foreground/30 uppercase tracking-widest text-xs">No books marked as dispatched yet</span>
                      </TableCell>
                    </TableRow>
                  );
                }
                return dispatchedRecords.map((item) => (
                  <TableRow key={item.employeeId} className="group hover:bg-emerald-50/20 transition-colors border-b last:border-0 h-24">
                    <TableCell className="p-6">
                      <Checkbox checked={selectedIds.includes(item.employeeId)} onCheckedChange={() => toggleSelect(item.employeeId)} className="rounded-lg h-5 w-5" />
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground/80">{item.name}</span>
                        <span className="text-[10px] font-black uppercase text-primary/40 tracking-[0.2em] mt-1">{item.employeeId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-emerald-600" />
                        </div>
                        <span className="text-sm font-semibold text-muted-foreground">{item.vendor}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-foreground/60">{item.officeMobileNo}</span>
                        <span className="text-xs font-bold text-foreground/60">{item.personalMobileNo}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <span className="text-xs font-medium text-muted-foreground line-clamp-2 max-w-[200px]">{item.address}</span>
                    </TableCell>
                    <TableCell className="p-6 text-right flex items-center justify-end gap-3">
                      <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">Shipped</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(item.employeeId, 'dispatched')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ));
              }
              return null;
            })()}
          </TableBody>
        </Table>
      </div>

      <BookRecipientUpload 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={fetchData}
      />

      <DispatchedUpload 
        isOpen={isDispatchedUploadOpen}
        onClose={() => setIsDispatchedUploadOpen(false)}
        onSuccess={fetchData}
      />

      <ResetSubmissionUpload 
        isOpen={isResetUploadOpen}
        onClose={() => setIsResetUploadOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
