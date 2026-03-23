"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { FileUpload } from "./file-upload";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  User, 
  Building2, 
  Smartphone, 
  CreditCard,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  FileText,
  Loader2,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(2, "Name as per ID Proof is required"),
  employer: z.string().min(2, "Company/Agency is required"),
  residentialState: z.string().min(2, "Residential State is required"),
  city: z.string().min(2, "City is required"),
  pincode: z.string().regex(/^[0-9]{6}$/, "Pincode must be exactly 6 digits"),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"),
  employeeId: z.string().min(2, "Employee ID is required"),
  phase: z.string().optional(),
  idType: z.enum(["PAN", "AADHAAR", "DL", "PASSPORT"], {
    message: "Please select an ID type",
  }),
  idNumber: z.string().optional(),
  originalDegree: z.boolean().refine((val) => val === true, {
    message: "You must confirm this is an original certificate",
  }),
});

interface CandidateFormPublicProps {
  clientId?: string;
  clientName?: string;
}

export function CandidateFormPublic({ clientId, clientName }: CandidateFormPublicProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isNominated, setIsNominated] = useState<boolean | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  
  const router = useRouter();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set());

  const handleUploadSuccess = (type: string) => {
    setUploadedDocs(prev => {
      const next = new Set(prev);
      next.add(type);
      return next;
    });
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      employer: "",
      residentialState: "",
      city: "",
      pincode: "",
      mobileNumber: "",
      employeeId: "",
      phase: "Phase 1",
      idType: undefined as any,
      idNumber: "",
      originalDegree: false,
    },
  });

  // 1. Session Initialization (Anonymous Tracking)
  useEffect(() => {
    const initSession = async () => {
      try {
        const storedToken = localStorage.getItem("cruxdoc_token");
        const storedId = localStorage.getItem("cruxdoc_id");
        
        if (storedToken && storedId) {
          const pingRes = await fetch(`/api/candidate/${storedToken}/heartbeat`, { 
            method: "POST", 
            body: JSON.stringify({ step: "STARTED" }) 
          });
          
          if (pingRes.ok) {
            setToken(storedToken);
            setCandidateId(storedId);
            setIsInitializing(false);
            return;
          } else {
            localStorage.removeItem("cruxdoc_token");
            localStorage.removeItem("cruxdoc_id");
          }
        }

        const res = await fetch("/api/candidate/init", { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId })
        });
        const data = await res.json();
        
        if (data.success) {
          localStorage.setItem("cruxdoc_token", data.candidate.token);
          localStorage.setItem("cruxdoc_id", data.candidate.id);
          setToken(data.candidate.token);
          setCandidateId(data.candidate.id);
        }
      } catch (err) {
        console.error("Failed to initialize session", err);
      } finally {
        setIsInitializing(false);
      }
    };

    initSession();
  }, [clientId]);

  // 2. Heartbeat Polling
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetch(`/api/candidate/${token}/heartbeat`, { method: "POST", body: JSON.stringify({}) }).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [token]);

  // 3. Auto-Save Debouncer
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (!token) return;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        try {
          await fetch(`/api/candidate/${token}/update-info`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: value.name || undefined,
              employer: value.employer || undefined,
              residentialState: value.residentialState || undefined,
              city: value.city || undefined,
              pincode: value.pincode || undefined,
              mobileNumber: value.mobileNumber || undefined,
              employeeId: value.employeeId || undefined,
              phase: value.phase || undefined,
              idType: value.idType || undefined,
              idNumber: value.idNumber || undefined,
            }),
          });
        } catch (err) {
          console.error("Auto-save failed implicitly", err);
        }
      }, 1000);
    });
    return () => subscription.unsubscribe();
  }, [form, token]);

  // 4. Master Data Auto-Fill Lookup
  const empIdWatch = form.watch("employeeId");
  const mobileWatch = form.watch("mobileNumber");
  
  useEffect(() => {
    if (!token) return;
    setIsNominated(null); // Immediate reset on change
    setLookupError(null);
    const hasEmpId = empIdWatch && empIdWatch.length >= 2;
    const hasMobile = mobileWatch && mobileWatch.length === 10;
    if (!hasEmpId && !hasMobile) {
      setIsNominated(null);
      setLookupError(null);
      return;
    }
    const lookupTimer = setTimeout(async () => {
      try {
        let qs = "";
        if (hasEmpId) qs += `employeeId=${encodeURIComponent(empIdWatch)}`;
        if (hasMobile) qs += `${qs ? "&" : ""}mobileNumber=${encodeURIComponent(mobileWatch)}`;
        const res = await fetch(`/api/candidate/lookup?${qs}`);
        const result = await res.json();
        
        if (result.success && result.data) {
          const m = result.data;
          setIsNominated(true);
          setLookupError(null);
          if (m.employeeName && !form.getValues("name")) form.setValue("name", m.employeeName, { shouldValidate: true });
          if (m.vendor && !form.getValues("employer")) form.setValue("employer", m.vendor, { shouldValidate: true });
          if (m.state && !form.getValues("residentialState")) form.setValue("residentialState", m.state, { shouldValidate: true });
          if (m.city && !form.getValues("city")) form.setValue("city", m.city, { shouldValidate: true });
          if (m.pincode && !form.getValues("pincode")) form.setValue("pincode", m.pincode, { shouldValidate: true });
          if (m.phase) form.setValue("phase", m.phase, { shouldValidate: true });
          const mobile = m.personalMobileNo || m.officeMobileNo;
          if (mobile && !form.getValues("mobileNumber")) form.setValue("mobileNumber", mobile, { shouldValidate: true });
        } else {
          setIsNominated(false);
          setLookupError("You are not nominated for this batch.");
        }
      } catch (err) {
        setIsNominated(false);
        setLookupError("You are not nominated for this batch.");
      }
    }, 800);
    return () => clearTimeout(lookupTimer);
  }, [empIdWatch, mobileWatch, token, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token || isNominated !== true) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/candidate/${token}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "COMPLETED" })
      });
      setSubmitted(true);
      localStorage.removeItem("cruxdoc_token");
      localStorage.removeItem("cruxdoc_id");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }

  const allFieldsFilled = 
    form.watch("name") && 
    form.watch("employer") && 
    form.watch("residentialState") && 
    form.watch("mobileNumber") && 
    form.watch("employeeId") && 
    form.watch("idType") && 
    form.watch("originalDegree");

  const allDocsUploaded = 
    uploadedDocs.has("PHOTO") && 
    uploadedDocs.has("QUALIFICATION") && 
    uploadedDocs.has("ID_PROOF") && 
    uploadedDocs.has("SIGNATURE");

  const isFormReady = allFieldsFilled && allDocsUploaded && isNominated === true;

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-bold tracking-widest uppercase text-sm">Initializing Secure Session</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="glass-card p-12 rounded-3xl text-center space-y-6 animate-in zoom-in duration-500 max-w-lg mx-auto mt-12">
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-black text-foreground">Submission Complete!</h2>
        <p className="text-muted-foreground leading-relaxed">
          Your documents have been successfully uploaded and are now being reviewed by our verification team.
        </p>
        <Button variant="outline" className="rounded-2xl h-12 px-8 font-bold mt-4" onClick={() => window.location.reload()}>
          Start New Submission
        </Button>
      </div>
    );
  }

  if (!candidateId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 mt-12 animate-in fade-in duration-500 relative z-10">
        <div className="w-24 h-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-red-500/20">
            <ShieldCheck className="h-10 w-10 text-red-500 animate-pulse" />
        </div>
        <div>
            <h2 className="text-2xl font-black text-foreground mb-3">Database Synchronization Error</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">We were unable to secure a connection session.</p>
        </div>
        <Button onClick={() => window.location.reload()} className="rounded-xl px-10 h-12 font-bold bg-primary text-primary-foreground">
            Attempt Secure Reconnection
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-12 pb-20 mt-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          {clientName ? <span className="text-primary truncate block max-w-full px-4">{clientName}</span> : "Document"} <span className={clientName ? "text-foreground" : "text-primary"}>Submission</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto italic font-medium">
          Ensure all copies are clear and original.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          <div className="glass-card p-8 md:p-10 rounded-[2.5rem] space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-50">
               <span className="text-[10px] font-mono tracking-widest text-muted-foreground">SID: {candidateId?.substring(0,8)}</span>
            </div>
            
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight">Identity Verification</h3>
            </div>

            {isNominated === false && lookupError && (
              <div className="bg-red-500/10 border-2 border-red-500/20 rounded-2xl p-6 flex items-center gap-4 animate-in slide-in-from-top duration-500">
                <div className="w-12 h-12 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black text-red-600 uppercase tracking-wider">{lookupError}</h4>
                  <p className="text-xs text-red-500/80 font-bold uppercase tracking-tight italic">Please check your details and try again.</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Employee ID <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <Input placeholder="Enter Employee ID" className="pl-12 h-14 rounded-2xl bg-accent/30 border-none focus-visible:ring-2 focus-visible:ring-primary/50 text-base font-semibold" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Mobile Number <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <Input placeholder="Enter Mobile Number" maxLength={10} className="pl-12 h-14 rounded-2xl bg-accent/30 border-none focus-visible:ring-2 focus-visible:ring-primary/50 text-base font-semibold" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className={`space-y-10 transition-all duration-700 ${isNominated === true ? "opacity-100 scale-100" : "opacity-20 blur-sm pointer-events-none scale-[0.98]"}`}>
            <div className="glass-card p-8 md:p-10 rounded-[2.5rem] space-y-8">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-tight">Personal Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Name per ID Proof</FormLabel>
                      <FormControl><Input className="h-14 rounded-2xl bg-accent/30 border-none px-6" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employer"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Employer/Company</FormLabel>
                      <FormControl><Input className="h-14 rounded-2xl bg-accent/30 border-none px-6" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="residentialState"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">State</FormLabel>
                      <FormControl><Input className="h-14 rounded-2xl bg-accent/30 border-none px-6" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">City</FormLabel>
                      <FormControl><Input className="h-14 rounded-2xl bg-accent/30 border-none px-6" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Pincode</FormLabel>
                      <FormControl><Input maxLength={6} className="h-14 rounded-2xl bg-accent/30 border-none px-6" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="idType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">ID Type</FormLabel>
                      <FormControl>
                        <select {...field} className="w-full h-14 rounded-2xl bg-accent/30 border-none px-6 appearance-none">
                          <option value="" disabled selected>Select</option>
                          <option value="PAN">PAN</option>
                          <option value="AADHAAR">Aadhaar</option>
                          <option value="DL">DL</option>
                          <option value="PASSPORT">Passport</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 px-4">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <UploadCloud className="h-5 w-5" />
                  </div>
                  <h3 className="text-2xl font-black uppercase italic">Upload Documents</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FileUpload candidateId={candidateId as string} type="PHOTO" label="Photograph" maxSizeKB={10240} mandatory={true} onUploadSuccess={handleUploadSuccess} />
                <FileUpload candidateId={candidateId as string} type="QUALIFICATION" label="Qualification" maxSizeKB={10240} mandatory={true} onUploadSuccess={handleUploadSuccess} />
                <FileUpload candidateId={candidateId as string} type="ID_PROOF" label="Identity Proof" maxSizeKB={10240} mandatory={true} onUploadSuccess={handleUploadSuccess} />
                <FileUpload candidateId={candidateId as string} type="SIGNATURE" label="Signature" maxSizeKB={10240} mandatory={true} onUploadSuccess={handleUploadSuccess} />
              </div>
            </div>

            <div className="space-y-8">
              <FormField
                control={form.control}
                name="originalDegree"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-5 space-y-0 rounded-[2.5rem] border-2 border-emerald-500/30 p-8 bg-emerald-500/5">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-8 w-8 rounded-lg mt-1" /></FormControl>
                    <div className="space-y-2">
                      <FormLabel className="text-lg font-black text-emerald-900 uppercase">Original Certificate Confirmation</FormLabel>
                      <FormDescription className="text-sm font-bold text-emerald-800/70">I confirm these are original copies.</FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-center">
                <Button 
                    type="submit" 
                    disabled={!isFormReady || isSubmitting}
                    className={`h-20 px-16 rounded-[2.5rem] font-black text-xl shadow-2xl transition-all hover:scale-105 active:scale-95 ${isFormReady ? "bg-primary text-primary-foreground shadow-primary/40" : "bg-muted text-muted-foreground opacity-50"}`}
                >
                  {isSubmitting ? "Finalizing..." : isNominated === false ? "Not Nominated" : "Finalize Submission"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
