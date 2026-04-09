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
  name: z.string()
    .min(2, "Name as per ID Proof is required")
    .regex(/^(?![0-9.\-/]*$)[a-zA-Z0-9\s.]+$/, "Please enter your full name (dates or numbers not allowed)"),
  employer: z.string().min(2, "Company/Agency is required"),
  residentialState: z.string().min(2, "Residential State is required"),
  city: z.string().min(2, "City is required"),
  pincode: z.string().regex(/^[0-9]{6}$/, "Pincode must be exactly 6 digits"),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"),
  employeeId: z.string().min(2, "Employee ID is required"),
  phase: z.string().optional(),
  idType: z.enum(["PAN", "AADHAAR", "DL", "PASSPORT"], {
    message: "Please select an ID type",
  }).optional(),
  isDraCertified: z.boolean(),
  idNumber: z.string().optional(),
  originalDegree: z.boolean().refine((val) => val === true, {
    message: "You must confirm this is an original certificate",
  }),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  bookLanguage: z.string().optional(),
  trainingLanguage: z.string().optional(),
  examCenter: z.string().optional(),
});

interface CandidateFormPublicProps {
  clientId?: string;
  clientName?: string;
}

export function CandidateFormPublic({ clientId, clientName }: CandidateFormPublicProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [nominationStatus, setNominationStatus] = useState<"idle" | "verifying" | "nominated" | "blocked">("idle");
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
      phase: "",
      idType: undefined,
      idNumber: "",
      isDraCertified: false,
      originalDegree: false,
      addressLine1: "",
      addressLine2: "",
      bookLanguage: "",
      trainingLanguage: "",
      examCenter: "",
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
            // Fetch config even if token exists
            const confRes = await fetch(`/api/candidate/init`, { 
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ clientId })
            });
            const confData = await confRes.json();
            if (confData.clientConfig) setConfig(confData.clientConfig);
            
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
          if (data.clientConfig) setConfig(data.clientConfig);
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
              isDraCertified: value.isDraCertified ?? undefined,
              addressLine1: value.addressLine1 || undefined,
              addressLine2: value.addressLine2 || undefined,
              bookLanguage: value.bookLanguage || undefined,
              trainingLanguage: value.trainingLanguage || undefined,
              examCenter: value.examCenter || undefined,
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
    
    const hasEmpId = empIdWatch && empIdWatch.length >= 2;
    const hasMobile = mobileWatch && mobileWatch.length === 10;
    
    if (!hasEmpId && !hasMobile) {
      setNominationStatus("idle");
      setLookupError(null);
      return;
    }

    setNominationStatus("verifying");
    const abortController = new AbortController();

    const lookupTimer = setTimeout(async () => {
      try {
        let qs = "";
        if (hasEmpId) qs += `employeeId=${encodeURIComponent(empIdWatch)}`;
        if (hasMobile) qs += `${qs ? "&" : ""}mobileNumber=${encodeURIComponent(mobileWatch)}`;
        
        const res = await fetch(`/api/candidate/lookup?${qs}`, { signal: abortController.signal });
        const result = await res.json();
        
        if (result.success && result.data) {
          const m = result.data;
          setNominationStatus("nominated");
          setLookupError(null);
          
          // Prevent re-submission if already completed
          if (result.alreadySubmitted) {
            setNominationStatus("blocked");
            setLookupError("YOUR DOCUMENTS ALREADY SUBMITTED");
            return;
          }

          // Resume Session if found
          if (result.existingCandidate) {
            const ext = result.existingCandidate;
            setToken(ext.token);
            setCandidateId(ext.id);
            localStorage.setItem("cruxdoc_token", ext.token);
            localStorage.setItem("cruxdoc_id", ext.id);
            
            if (ext.uploadedDocumentTypes) {
              setUploadedDocs(new Set(ext.uploadedDocumentTypes));
            }

            // Sync form values from existing candidate
            if (ext.addressLine1) form.setValue("addressLine1", ext.addressLine1);
            if (ext.addressLine2) form.setValue("addressLine2", ext.addressLine2);
            if (ext.bookLanguage) form.setValue("bookLanguage", ext.bookLanguage);
            if (ext.trainingLanguage) form.setValue("trainingLanguage", ext.trainingLanguage);
            if (ext.examCenter) form.setValue("examCenter", ext.examCenter);
          }

          if (m.employeeName && !form.getValues("name")) form.setValue("name", m.employeeName, { shouldValidate: true });
          if (m.vendor && !form.getValues("employer")) form.setValue("employer", m.vendor, { shouldValidate: true });
          if (m.state && !form.getValues("residentialState")) form.setValue("residentialState", m.state, { shouldValidate: true });
          if (m.city && !form.getValues("city")) form.setValue("city", m.city, { shouldValidate: true });
          if (m.pincode && !form.getValues("pincode")) form.setValue("pincode", m.pincode, { shouldValidate: true });
          if (m.phase) form.setValue("phase", m.phase, { shouldValidate: true });
          
          const mobile = m.personalMobileNo || m.officeMobileNo;
          if (mobile && !form.getValues("mobileNumber")) form.setValue("mobileNumber", mobile, { shouldValidate: true });
        } else {
          setNominationStatus("blocked");
          setLookupError("YOU ARE NOT NOMINATED FOR THIS BATCH");
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setNominationStatus("blocked");
        setLookupError("YOU ARE NOT NOMINATED FOR THIS BATCH");
      }
    }, 800);

    return () => {
      clearTimeout(lookupTimer);
      abortController.abort();
    };
  }, [empIdWatch, mobileWatch, token, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token || nominationStatus !== "nominated") return;
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

  const isDraCertified = form.watch("isDraCertified");

  const checkMandatory = (field: string) => {
    if (!config || !config[field]) return true; // Disabled means not mandatory
    if (config[field] === "MANDATORY") {
      return !!form.watch(field as any);
    }
    return true; // Optional means filled is OK
  };

  const allFieldsFilled = isDraCertified 
    ? (form.watch("employeeId") && form.watch("originalDegree"))
    : (form.watch("name") && 
       form.watch("employer") && 
       form.watch("residentialState") && 
       form.watch("mobileNumber") && 
       form.watch("employeeId") && 
       form.watch("idType") && 
       form.watch("city") &&
       form.watch("pincode") &&
       form.watch("idNumber") &&
       form.watch("originalDegree") &&
       checkMandatory("addressLine1") &&
       checkMandatory("addressLine2") &&
       checkMandatory("city") &&
       checkMandatory("state") &&
       checkMandatory("pincode") &&
       checkMandatory("bookLanguage") &&
       checkMandatory("trainingLanguage") &&
       checkMandatory("examCenter")
    );

  const allDocsUploaded = isDraCertified
    ? uploadedDocs.has("DRA_CERTIFICATE")
    : (uploadedDocs.has("PHOTO") && 
       uploadedDocs.has("QUALIFICATION") && 
       uploadedDocs.has("ID_PROOF") && 
       uploadedDocs.has("SIGNATURE"));

  const isFormReady = allFieldsFilled && allDocsUploaded && nominationStatus === "nominated";

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
    <div className="w-full space-y-12 pb-20 mt-12 px-4 md:px-0">
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

            <FormField
              control={form.control}
              name="isDraCertified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-2xl border-2 border-primary/20 p-4 bg-primary/5 mb-6">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="h-6 w-6 rounded-md"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-black text-primary uppercase tracking-tight cursor-pointer">
                      Are you DRA Certified already?
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {nominationStatus === "blocked" && lookupError && (
              <div className="bg-red-500/10 border-2 border-red-500/20 rounded-2xl p-6 flex items-center gap-4 animate-in slide-in-from-top duration-500">
                <div className="w-12 h-12 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black text-red-600 uppercase tracking-wider leading-tight">{lookupError}</h4>
                </div>
              </div>
            )}

            {nominationStatus === "verifying" && (
              <div className="bg-primary/5 border-2 border-primary/10 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <p className="text-xs font-bold text-primary uppercase tracking-widest">Verifying nomination details...</p>
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

          <div className={`space-y-10 transition-all duration-700 ${nominationStatus === "nominated" ? "opacity-100 scale-100" : "opacity-20 blur-sm pointer-events-none scale-[0.98]"}`}>
            {/* Conditional Address Section */}
            {!isDraCertified && config && (config.addressLine1 !== "DISABLED" || config.addressLine2 !== "DISABLED") && (
              <div className="glass-card p-8 md:p-10 rounded-[2.5rem] space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold uppercase tracking-tight">Postal Address Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {config.addressLine1 !== "DISABLED" && (
                    <FormField
                      control={form.control}
                      name="addressLine1"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                            Address Line 1 {config.addressLine1 === "MANDATORY" && <span className="text-red-500">*</span>}
                          </FormLabel>
                          <FormControl><Input placeholder="Flat, House no., Building, Company" className="h-14 rounded-2xl bg-accent/30 border-none px-6" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {config.addressLine2 !== "DISABLED" && (
                    <FormField
                      control={form.control}
                      name="addressLine2"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                            Street/Area {config.addressLine2 === "MANDATORY" && <span className="text-red-500">*</span>}
                          </FormLabel>
                          <FormControl><Input placeholder="Street name, Sector, Village" className="h-14 rounded-2xl bg-accent/30 border-none px-6" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Dynamic Section: Course & Language Preferences */}
            {!isDraCertified && config && (config.bookLanguage !== "DISABLED" || config.trainingLanguage !== "DISABLED") && (
              <div className="glass-card p-8 md:p-10 rounded-[2.5rem] space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
                        <FileText className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold uppercase tracking-tight">Course & Language Preferences</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {config.bookLanguage !== "DISABLED" && (
                    <FormField
                      control={form.control}
                      name="bookLanguage"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                            Book Language {config.bookLanguage === "MANDATORY" && <span className="text-red-500">*</span>}
                          </FormLabel>
                          <FormControl>
                            <select {...field} className="w-full h-14 rounded-2xl bg-accent/30 border-none px-6 appearance-none font-semibold">
                              <option value="" disabled>Select Preference</option>
                              {["English", "Hindi", "Gujarati", "Marathi", "Bengali", "Kannada", "Malayalam", "Tamil", "Telugu"].map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {config.trainingLanguage !== "DISABLED" && (
                    <FormField
                      control={form.control}
                      name="trainingLanguage"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                            Training Language {config.trainingLanguage === "MANDATORY" && <span className="text-red-500">*</span>}
                          </FormLabel>
                          <FormControl>
                            <select {...field} className="w-full h-14 rounded-2xl bg-accent/30 border-none px-6 appearance-none font-semibold">
                              <option value="" disabled>Select Preference</option>
                              {["English", "Hindi", "Gujarati", "Marathi", "Bengali", "Kannada", "Malayalam", "Tamil", "Telugu"].map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Dynamic Section: Preferred Exam Center */}
            {!isDraCertified && config && config.examCenter !== "DISABLED" && (
              <div className="glass-card p-8 md:p-10 rounded-[2.5rem] space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold uppercase tracking-tight">Examination Venue</h3>
                </div>
                <FormField
                  control={form.control}
                  name="examCenter"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                        Preferred Exam Center {config.examCenter === "MANDATORY" && <span className="text-red-500">*</span>}
                      </FormLabel>
                      <FormControl>
                        <select {...field} className="w-full h-14 rounded-2xl bg-accent/30 border-none px-6 appearance-none font-semibold">
                          <option value="" disabled>Select Exam Center</option>
                          {config.examCenters?.map((center: string) => (
                            <option key={center} value={center}>{center}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {!isDraCertified && (
              <div className="glass-card p-8 md:p-10 rounded-[2.5rem] space-y-8">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-tight">Identity Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Name per ID Proof <span className="text-red-500">*</span></FormLabel>
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
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Employer/Company <span className="text-red-500">*</span></FormLabel>
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
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Residential State <span className="text-red-500">*</span></FormLabel>
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
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">City <span className="text-red-500">*</span></FormLabel>
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
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Pincode <span className="text-red-500">*</span></FormLabel>
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
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">ID Type <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <select {...field} className="w-full h-14 rounded-2xl bg-accent/30 border-none px-6 appearance-none font-semibold">
                          <option value="" disabled>Select</option>
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
            )}

            <div className="space-y-6">
              <div className="flex items-center gap-3 px-4">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <UploadCloud className="h-5 w-5" />
                  </div>
                  <h3 className="text-2xl font-black uppercase italic">Upload Documents</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {isDraCertified ? (
                  <FileUpload 
                    candidateId={candidateId as string} 
                    type="DRA_CERTIFICATE" 
                    label="DRA Certificate" 
                    maxSizeKB={10240} 
                    mandatory={true} 
                    initialSuccess={uploadedDocs.has("DRA_CERTIFICATE")} 
                    onUploadSuccess={handleUploadSuccess} 
                    description="Upload your original DRA Certification document"
                  />
                ) : (
                  <>
                    <FileUpload candidateId={candidateId as string} type="PHOTO" label="Photograph" maxSizeKB={10240} mandatory={true} initialSuccess={uploadedDocs.has("PHOTO")} onUploadSuccess={handleUploadSuccess} />
                    <FileUpload candidateId={candidateId as string} type="QUALIFICATION" label="Qualification" maxSizeKB={10240} mandatory={true} initialSuccess={uploadedDocs.has("QUALIFICATION")} onUploadSuccess={handleUploadSuccess} />
                    <FileUpload 
                      candidateId={candidateId as string} 
                      type="ID_PROOF" 
                      label="Identity Proof" 
                      maxSizeKB={10240} 
                      mandatory={true} 
                      initialSuccess={uploadedDocs.has("ID_PROOF")} 
                      onUploadSuccess={handleUploadSuccess} 
                      onOcrSuccess={(val) => form.setValue("idNumber", val, { shouldValidate: true })}
                      subType={form.watch("idType")}
                    />
                    <FileUpload candidateId={candidateId as string} type="SIGNATURE" label="Signature" maxSizeKB={10240} mandatory={true} initialSuccess={uploadedDocs.has("SIGNATURE")} onUploadSuccess={handleUploadSuccess} />
                  </>
                )}
              </div>

              {uploadedDocs.has("ID_PROOF") && !isDraCertified && (
                <div className="mt-8 pt-8 border-t border-primary/10 animate-in slide-in-from-top-4 duration-500">
                  <FormField
                    control={form.control}
                    name="idNumber"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                           Confirm {form.watch("idType") || "ID"} Number <span className="text-red-500">*</span>
                        </FormLabel>
                        <p className="text-xs text-muted-foreground mb-4 italic">The ID number has been automatically extracted. Please confirm or correct it if needed.</p>
                        <FormControl><Input placeholder={`Enter your ${form.watch("idType") || "ID"} number`} className="h-14 rounded-2xl bg-primary/10 border-2 border-primary/30 px-6 font-bold text-lg text-primary shadow-inner" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
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
                  {isSubmitting ? "Finalizing..." : nominationStatus === "blocked" ? "Not Nominated" : "Finalize Submission"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
