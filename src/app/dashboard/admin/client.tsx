"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UserPlus, Building2, Mail, Lock, Link as LinkIcon, Plus, Globe, Copy, CheckCircle, Edit2, Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function AdminManagementClient({ initialVendors, initialClients, role }: { initialVendors: any[], initialClients: any[], role: string }) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  
  const [activeTab, setActiveTab] = useState<"vendors" | "clients">("vendors");

  useEffect(() => {
    if (tabParam === "clients") {
      setActiveTab("clients");
    } else if (tabParam === "vendors") {
      setActiveTab("vendors");
    }
  }, [tabParam]);

  const [vendors, setVendors] = useState(initialVendors);
  const [clients, setClients] = useState(initialClients);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [clientName, setClientName] = useState("");
  const [clientSlug, setClientSlug] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Vendor State
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editVendorName, setEditVendorName] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Edit Client State
  const [editingClient, setEditingClient] = useState<any>(null);
  const [editClientName, setEditClientName] = useState("");
  const [editClientSlug, setEditClientSlug] = useState("");
  const [isDeletingClient, setIsDeletingClient] = useState<string | null>(null);

  const handleCreateVendor = async () => {
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

  const handleUpdateVendor = async () => {
    if (!editingVendor) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/vendors/${editingVendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: editEmail, password: editPassword, vendorName: editVendorName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setVendors(vendors.map(v => v.id === editingVendor.id ? data.vendor : v));
      setEditingVendor(null);
      setMessage("Vendor updated successfully!");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) return;
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/vendors/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setVendors(vendors.filter(v => v.id !== id));
      setMessage("Vendor deleted successfully!");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleUpdateClient = async () => {
    if (!editingClient) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/clients/${editingClient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editClientName, slug: editClientSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setClients(clients.map(c => c.id === editingClient.id ? data.client : c));
      setEditingClient(null);
      setMessage("Client updated successfully!");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client? All associated data and links will be removed.")) return;
    setIsDeletingClient(id);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setClients(clients.filter(c => c.id !== id));
      setMessage("Client deleted successfully!");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setIsDeletingClient(null);
    }
  };

  const handleCreateClient = async () => {
    if (!clientName || !clientSlug) {
      setMessage("Client Name and Link Slug are required.");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clientName, slug: clientSlug.toLowerCase().replace(/\s+/g, '-') }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setClients([...clients, data.client]);
      setClientName("");
      setClientSlug("");
      setMessage("Client created successfully!");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex bg-accent/30 p-1 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab("vendors")}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === "vendors" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          Vendors (Organization Portals)
        </button>
        <button 
          onClick={() => setActiveTab("clients")}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === "clients" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          Clients (Application Links)
        </button>
      </div>

      {activeTab === "vendors" ? (
        <>
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

            {(role === "SUPERADMIN" || role === "ADMIN") && (
              <div className="mt-6 flex justify-end">
                <Button onClick={handleCreateVendor} disabled={loading} className="h-12 rounded-2xl px-8 font-bold tracking-wide shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02]">
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  Create Credentials
                </Button>
              </div>
            )}
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
                      <div className="flex gap-1">
                        {(role === "SUPERADMIN" || role === "ADMIN") && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary"
                              onClick={() => {
                                setEditingVendor(v);
                                setEditEmail(v.email);
                                setEditVendorName(v.vendorName);
                                setEditPassword("");
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg hover:bg-red-500/10 text-red-500"
                              disabled={isDeleting === v.id}
                              onClick={() => handleDeleteVendor(v.id)}
                            >
                              {isDeleting === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </>
                        )}
                        <Badge variant="secondary" className="text-[8px] tracking-tight">VENDOR</Badge>
                      </div>
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
        </>
      ) : (
        <>
          {(role === "SUPERADMIN" || role === "ADMIN") && (
            <div className="glass-card p-6 md:p-8 rounded-3xl animate-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> Register New Client
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Client Official Name</label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <Input placeholder="E.g. TVS Credit" value={clientName} onChange={e => setClientName(e.target.value)} className="pl-12 h-12 rounded-2xl bg-accent/30 border-none focus-visible:ring-2 focus-visible:ring-primary/50 font-medium" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Unique Link Slug</label>
                  <div className="relative group">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <Input placeholder="tvs-credit" value={clientSlug} onChange={e => setClientSlug(e.target.value)} className="pl-12 h-12 rounded-2xl bg-accent/30 border-none focus-visible:ring-2 focus-visible:ring-primary/50 font-medium" />
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-1 font-medium italic">Final link will be: {typeof window !== 'undefined' ? window.location.origin : ''}/apply/{clientSlug || 'slug'}</p>
                </div>
              </div>

              {message && (
                <p className={`mt-4 text-sm font-bold ${message.includes("success") ? "text-emerald-500" : "text-red-500"}`}>
                  {message}
                </p>
              )}

              <div className="mt-6 flex justify-end">
                <Button onClick={handleCreateClient} disabled={loading} className="h-12 rounded-2xl px-8 font-bold tracking-wide shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02]">
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Register Client Link
                </Button>
              </div>
            </div>
          )}

          <div className="glass-card p-6 md:p-8 rounded-3xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Active Client Links
            </h2>
            {clients.length === 0 ? (
              <div className="text-center py-10 bg-accent/30 rounded-2xl border-2 border-dashed border-primary/10">
                <p className="text-muted-foreground font-medium">No client links generated yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map((c: any) => {
                  const fullUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/apply/${c.slug}`;
                  return (
                    <div key={c.id} className="p-6 rounded-3xl bg-background border shadow-sm group hover:border-primary/30 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase text-xl">
                          {c.name.substring(0,2)}
                        </div>
                        <div className="flex gap-1">
                          {(role === "SUPERADMIN" || role === "ADMIN") && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary"
                                onClick={() => {
                                  setEditingClient(c);
                                  setEditClientName(c.name);
                                  setEditClientSlug(c.slug);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg hover:bg-red-500/10 text-red-500"
                                disabled={isDeletingClient === c.id}
                                onClick={() => handleDeleteClient(c.id)}
                              >
                                {isDeletingClient === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </>
                          )}
                          <Badge variant="outline" className="border-primary/20 text-primary uppercase text-[8px] px-2 py-0.5">ACTIVE LINK</Badge>
                        </div>
                      </div>
                      <Link href={`/dashboard/clients/${c.id}`} className="hover:opacity-80 transition-opacity">
                        <h3 className="font-bold text-foreground text-xl mb-1 flex items-center gap-2">
                          {c.name} <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </h3>
                      </Link>
                      <p className="text-muted-foreground text-xs mb-4">Click below to copy your unique application link.</p>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(fullUrl, c.id)}
                        className={`w-full h-11 rounded-xl font-bold border-dashed border-2  transition-all relative overflow-hidden group/btn ${copiedId === c.id ? 'border-emerald-500 text-emerald-600 bg-emerald-500/5' : 'border-primary/20 text-primary hover:bg-primary/5'}`}
                      >
                        {copiedId === c.id ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" /> Link Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" /> Copy Unique Link
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Vendor Modal */}
      {editingVendor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-md rounded-3xl p-8 shadow-2xl border border-primary/10 animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black tracking-tight mb-2">Edit Vendor Credentials</h2>
            <p className="text-muted-foreground text-sm mb-6 font-medium font-inter tracking-tight">Updating information for <span className="text-primary font-bold">{editingVendor.vendorName}</span></p>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Company Name</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                  <Input value={editVendorName} onChange={(e) => setEditVendorName(e.target.value)} className="pl-12 h-14 rounded-2xl bg-accent/20 border-none focus-visible:ring-2 focus-visible:ring-primary/40 font-bold tracking-tight" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                  <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="pl-12 h-14 rounded-2xl bg-accent/20 border-none focus-visible:ring-2 focus-visible:ring-primary/40 font-bold tracking-tight" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">New Password (Optional)</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                  <Input type="password" placeholder="Leave empty to keep current" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className="pl-12 h-14 rounded-2xl bg-accent/20 border-none focus-visible:ring-2 focus-visible:ring-primary/40 font-bold tracking-tight" />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button variant="ghost" onClick={() => setEditingVendor(null)} className="h-14 flex-1 rounded-2xl font-bold tracking-tight hover:bg-accent">
                Cancel
              </Button>
              <Button onClick={handleUpdateVendor} disabled={loading} className="h-14 flex-1 rounded-2xl font-black tracking-tight bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.02]">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-md rounded-3xl p-8 shadow-2xl border border-primary/10 animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black tracking-tight mb-2">Edit Client Details</h2>
            <p className="text-muted-foreground text-sm mb-6 font-medium font-inter tracking-tight">Updating information for <span className="text-primary font-bold">{editingClient.name}</span></p>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Client Official Name</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                  <Input value={editClientName} onChange={(e) => setEditClientName(e.target.value)} className="pl-12 h-14 rounded-2xl bg-accent/20 border-none focus-visible:ring-2 focus-visible:ring-primary/40 font-bold tracking-tight" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Unique Link Slug</label>
                <div className="relative group">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                  <Input value={editClientSlug} onChange={(e) => setEditClientSlug(e.target.value)} className="pl-12 h-14 rounded-2xl bg-accent/20 border-none focus-visible:ring-2 focus-visible:ring-primary/40 font-bold tracking-tight" />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button variant="ghost" onClick={() => setEditingClient(null)} className="h-14 flex-1 rounded-2xl font-bold tracking-tight hover:bg-accent">
                Cancel
              </Button>
              <Button onClick={handleUpdateClient} disabled={loading} className="h-14 flex-1 rounded-2xl font-black tracking-tight bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.02]">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
