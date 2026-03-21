"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UserPlus, Building2, Mail, Lock } from "lucide-react";

export function VendorManagementClient({ initialVendors }: { initialVendors: any[] }) {
  const [vendors, setVendors] = useState(initialVendors);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleCreate = async () => {
    if (!email || !password || !vendorName) {
      setMessage("All fields are required.");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, vendorName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setVendors([...vendors, data.vendor]);
      setEmail("");
      setPassword("");
      setVendorName("");
      setMessage("Vendor created successfully!");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-card p-6 md:p-8 rounded-3xl animate-in slide-in-from-bottom-2 duration-500">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" /> Create New Vendor
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Vendor/Company Name</label>
            <div className="relative group">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <Input placeholder="TVS Credit" value={vendorName} onChange={e => setVendorName(e.target.value)} className="pl-12 h-12 rounded-2xl bg-accent/30 border-none focus-visible:ring-2 focus-visible:ring-primary/50 font-medium" />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Login Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <Input type="email" placeholder="vendor@tvs.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-12 h-12 rounded-2xl bg-accent/30 border-none focus-visible:ring-2 focus-visible:ring-primary/50 font-medium" />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Secure Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-12 h-12 rounded-2xl bg-accent/30 border-none focus-visible:ring-2 focus-visible:ring-primary/50 font-medium" />
            </div>
          </div>
        </div>

        {message && (
          <p className={`mt-4 text-sm font-bold ${message.includes("success") ? "text-emerald-500" : "text-red-500"}`}>
            {message}
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={handleCreate} disabled={loading} className="h-12 rounded-2xl px-8 font-bold tracking-wide shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02]">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
            Create Credentials
          </Button>
        </div>
      </div>

      <div className="glass-card p-6 md:p-8 rounded-3xl">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" /> Active Vendors
        </h2>
        {vendors.length === 0 ? (
          <div className="text-center py-10 bg-accent/30 rounded-2xl border-2 border-dashed border-primary/10">
            <p className="text-muted-foreground font-medium">No vendors registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((v: any) => (
              <div key={v.id} className="p-5 rounded-2xl bg-background border shadow-sm group hover:-translate-y-1 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase">
                    {v.vendorName?.substring(0,2) || "VD"}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-2 py-1 rounded-full">
                    VENDOR
                  </span>
                </div>
                <h3 className="font-bold text-foreground text-lg truncate">{v.vendorName || "Unknown Vendor"}</h3>
                <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1 truncate">
                  <Mail className="h-3 w-3" /> {v.email}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
