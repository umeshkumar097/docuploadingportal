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
  CheckCircle2
} from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";

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
  employeeId: string;
  employeeName: string;
  officeMobileNo?: string;
  personalMobileNo?: string;
  vendor?: string;
}

export default function AddressManagementPage() {
  const [records, setRecords] = useState<AddressRecord[]>([]);
  const [pendingRecords, setPendingRecords] = useState<PendingRecord[]>([]);
  const [totalMaster, setTotalMaster] = useState(0);
  const [view, setView] = useState<"submissions" | "pending">("submissions");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormEnabled, setIsFormEnabled] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
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
    if (selectedIds.length === records.length && records.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map(r => r.id));
    }
  }

  async function deleteSelected() {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} records?`)) return;

    try {
      const res = await fetch("/api/dashboard/addresses", {
        method: "DELETE",
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        setRecords(prev => prev.filter(r => !selectedIds.includes(r.id)));
        setSelectedIds([]);
        setMessage({ type: "success", text: "Records deleted successfully" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete records" });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  }

  function exportToExcel() {
    const selectedData = records.filter(r => selectedIds.includes(r.id));
    const dataToExport = selectedData.map(r => ({
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

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
         <div className="bg-card border rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <MapPin className="h-20 w-20" />
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground mb-1">Total Masters Uploaded</span>
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
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground mb-1">Submissions Received</span>
            <div className="flex items-end gap-2">
                <span className="text-4xl font-black tracking-tighter text-foreground">{records.length}</span>
                <span className="text-xs font-bold text-emerald-500 mb-1.5 flex items-center gap-1 uppercase">
                   <RefreshCw className="h-3 w-3" /> Live
                </span>
            </div>
         </div>
         
         <div className="bg-card border rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <AlertCircle className="h-20 w-20" />
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground mb-1">Pending Submissions</span>
            <div className="flex items-end gap-2">
                <span className="text-4xl font-black tracking-tighter text-rose-500">{pendingRecords.length}</span>
                <span className="text-xs font-bold text-rose-500 mb-1.5 flex items-center gap-1 uppercase">
                   Missing
                </span>
            </div>
         </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-6 p-1 bg-muted rounded-2xl w-fit">
          <Button 
            variant={view === "submissions" ? "default" : "ghost"}
            onClick={() => setView("submissions")}
            className="rounded-xl h-10 px-6 font-bold"
          >
            Submissions ({records.length})
          </Button>
          <Button 
            variant={view === "pending" ? "default" : "ghost"}
            onClick={() => setView("pending")}
            className="rounded-xl h-10 px-6 font-bold"
          >
            Pending ({pendingRecords.length})
          </Button>
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
                    onClick={deleteSelected}
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

      {/* Feedback Messages */}
      {message && (
          <div className={`fixed top-10 right-10 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 ${message.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-rose-500/10 border-rose-500/20 text-rose-600"}`}>
             {message.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
             <span className="font-bold text-sm">{message.text}</span>
          </div>
      )}

      {/* Data Table */}
      <div className="bg-card border rounded-[2.5rem] overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="w-14 p-6">
                <Checkbox 
                  checked={selectedIds.length === records.length && records.length > 0}
                  onCheckedChange={toggleAll}
                  className="rounded-lg h-5 w-5"
                />
              </TableHead>
              <TableHead className="p-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground whitespace-nowrap">Employee Info</TableHead>
              <TableHead className="p-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground whitespace-nowrap">Organisation</TableHead>
              <TableHead className="p-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground whitespace-nowrap">Language</TableHead>
              <TableHead className="p-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground whitespace-nowrap">Address Details</TableHead>
              <TableHead className="p-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground whitespace-nowrap text-right">Submitted At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={6} className="p-20 text-center">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-muted-foreground/30 mb-4" />
                    <span className="font-bold text-muted-foreground/50 uppercase tracking-widest text-xs">Deciphering Records...</span>
                 </TableCell>
               </TableRow>
            ) : view === "submissions" ? (
                records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-20 text-center">
                       <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
                          <MapPin className="h-10 w-10 text-muted-foreground/20" />
                       </div>
                       <span className="font-bold text-muted-foreground/30 uppercase tracking-widest text-xs">No address records found</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id} className="group hover:bg-accent/30 transition-colors border-b last:border-0 h-24">
                      <TableCell className="p-6">
                        <Checkbox 
                          checked={selectedIds.includes(record.id)}
                          onCheckedChange={() => toggleSelect(record.id)}
                          className="rounded-lg h-5 w-5"
                        />
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
                              {(record.addressLine2 || record.addressLine3) && (
                                  <span className="text-[11px] font-semibold text-muted-foreground truncate max-w-[300px]">
                                      {[record.addressLine2, record.addressLine3].filter(Boolean).join(", ")}
                                  </span>
                              )}
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
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                  {format(new Date(record.createdAt), "HH:mm")}
                              </span>
                          </div>
                      </TableCell>
                    </TableRow>
                  ))
                )
            ) : (
                pendingRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-20 text-center">
                       <CheckCircle2 className="h-10 w-10 text-emerald-500/20 mx-auto mb-6" />
                       <span className="font-bold text-muted-foreground/30 uppercase tracking-widest text-xs">All employees have submitted!</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingRecords.map((item) => (
                    <TableRow key={item.employeeId} className="group hover:bg-accent/30 transition-colors border-b last:border-0 h-20">
                      <TableCell className="p-6"></TableCell>
                      <TableCell className="p-6">
                          <div className="flex flex-col">
                             <span className="font-bold text-foreground">{item.employeeName}</span>
                             <span className="text-[10px] font-black uppercase text-primary/60 tracking-wider font-mono">{item.employeeId}</span>
                          </div>
                      </TableCell>
                      <TableCell className="p-6">
                          <span className="text-sm font-semibold opacity-60">{item.vendor || "N/A"}</span>
                      </TableCell>
                      <TableCell className="p-6">
                          <div className="flex flex-col text-[10px] font-bold text-muted-foreground">
                              <span>O: {item.officeMobileNo || "-"}</span>
                              <span>P: {item.personalMobileNo || "-"}</span>
                          </div>
                      </TableCell>
                      <TableCell className="p-6" colSpan={2}>
                          <div className="flex items-center gap-2 text-rose-500 bg-rose-50 w-fit px-4 py-2 rounded-xl border border-rose-100">
                             <AlertCircle className="h-3 w-3" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Pending Submission</span>
                          </div>
                      </TableCell>
                    </TableRow>
                  ))
                )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
