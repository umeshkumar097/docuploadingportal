"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, AlertCircle, Phone, Download, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

interface OutreachTableProps {
  data: any[];
}

export function OutreachTable({ data }: OutreachTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const uniqueVendors = useMemo(() => {
    const vendors = data.map(m => m.vendor).filter(Boolean);
    return Array.from(new Set(vendors)).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((m: any) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        (m.employeeName?.toLowerCase().includes(q)) ||
        (m.employeeId?.toLowerCase().includes(q)) ||
        (m.whatsappNo?.includes(searchQuery));
      
      const matchesVendor = vendorFilter === "all" || m.vendor === vendorFilter;
      
      return matchesSearch && matchesVendor;
    });
  }, [data, searchQuery, vendorFilter]);

  const handleExportExcel = () => {
    const dataToExport = filteredData.map(m => ({
      "Name": m.employeeName || "N/A",
      "Whatsapp Number": m.whatsappNo || "N/A",
      "Employee ID": m.employeeId || "N/A",
      "Vendor": m.vendor || "N/A"
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Outreach List");
    
    // Set column widths
    worksheet["!cols"] = [
      { wch: 30 }, // Name
      { wch: 20 }, // WhatsApp
      { wch: 15 }, // Emp ID
      { wch: 20 }, // Vendor
    ];

    const filename = `Outreach-List-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };
  
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name || 'this record'}"? This will remove them from the outreach list.`)) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/master-data/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during deletion");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between pb-2">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-pink-500 transition-colors" />
          <Input 
            placeholder="Search Name, Emp ID, or Mobile..." 
            className="pl-10 h-12 rounded-2xl bg-accent/20 border-accent/30 focus:bg-background focus:ring-pink-500/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              className="pl-10 pr-8 h-12 rounded-2xl bg-accent/20 border-accent/30 text-sm font-bold appearance-none hover:bg-accent/40 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-pink-500/20 min-w-[200px]"
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
            >
              <option value="all">All Vendors</option>
              {uniqueVendors.map((vendor: any) => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
          </div>
          
          <Button 
            onClick={handleExportExcel}
            className="h-12 rounded-2xl px-6 font-bold bg-pink-600 text-white hover:bg-pink-700 transition-all gap-2 shadow-lg shadow-pink-500/20"
          >
            <Download className="h-4 w-4" />
            Export Calling List
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden">
        <Table>
          <TableHeader className="bg-accent/30 font-black">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest pl-8">Candidate Name</TableHead>
              <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Emp ID</TableHead>
              <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">WhatsApp Number</TableHead>
              <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Vendor Context</TableHead>
              <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-center">Actions</TableHead>
              <TableHead className="py-5 font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-right pr-8">Contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((m: any) => (
              <TableRow key={m.id} className="hover:bg-pink-500/5 transition-colors border-accent/20">
                <TableCell className="py-6 pl-8">
                  <span className="font-bold text-foreground text-sm">{m.employeeName || "N/A"}</span>
                </TableCell>
                <TableCell className="py-6 font-medium text-xs text-muted-foreground uppercase tracking-tighter">{m.employeeId}</TableCell>
                <TableCell className="py-6">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold text-sm tracking-tight">{m.whatsappNo || "N/A"}</span>
                    {m.whatsappNo && (
                      <a href={`https://wa.me/91${m.whatsappNo}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-emerald-500/10 rounded-md transition-colors">
                        <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.435 5.632 1.442h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-6">
                  <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary uppercase">{m.vendor || "N/A"}</Badge>
                </TableCell>
                <TableCell className="py-6 text-center">
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={deletingId === m.id}
                    className="rounded-xl hover:bg-red-500/10 text-red-500 transition-all font-bold group h-9 w-9"
                    onClick={() => handleDelete(m.id, m.employeeName)}
                  >
                    {deletingId === m.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="py-6 pr-8 text-right">
                  <a href={`tel:${m.personalMobileNo || m.officeMobileNo || ''}`} className="inline-block">
                    <Button variant="ghost" size="sm" className="rounded-xl hover:bg-pink-500/10 text-pink-600 font-black uppercase text-[10px] tracking-widest gap-2">
                        <Phone className="h-3 w-3" /> Call Required
                    </Button>
                  </a>
                </TableCell>
              </TableRow>
            ))}
            {filteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3 opacity-50">
                    <AlertCircle className="h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">No pending outreach found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
