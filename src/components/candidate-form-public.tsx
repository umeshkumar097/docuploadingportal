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
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  employer: z.string().min(2, "Employer is required"),
  mobileNumber: z.string().min(10, "Valid mobile number is required"),
  employeeId: z.string().min(2, "Employee ID is required"),
  originalDegree: z.boolean().refine((val) => val === true, {
    message: "You must confirm this is an original certificate",
  }),
});

export function CandidateFormPublic() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const router = useRouter();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      employer: "",
      mobileNumber: "",
      employeeId: "",
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
          setToken(storedToken);
          setCandidateId(storedId);
          setIsInitializing(false);
          
          // Trigger immediate heartbeat to show they returned
          fetch(`/api/candidate/${storedToken}/heartbeat`, { 
            method: "POST", 
            body: JSON.stringify({ step: "STARTED" }) 
          }).catch(console.error);
          return;
        }

        // Create new anonymous session
        const res = await fetch("/api/candidate/init", { method: "POST" });
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
  }, []);

  // 2. Heartbeat Polling
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetch(`/api/candidate/${token}/heartbeat`, { method: "POST", body: JSON.stringify({}) }).catch(() => {});
    }, 15000); // Poll every 15 seconds for live radar
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
              mobileNumber: value.mobileNumber || undefined,
              employeeId: value.employeeId || undefined,
            }),
          });
        } catch (err) {
          console.error("Auto-save failed implicitly", err);
        }
      }, 1000); // 1s auto-save debounce
    });

    return () => subscription.unsubscribe();
  }, [form.watch, token]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token) return;
    setIsSubmitting(true);
    try {
      // Finalize candidate by sending a completed heartbeat structure
      // Realistically we update status to READY_FOR_BATCH but PENDING triggers Ops
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
    form.watch("mobileNumber") && 
    form.watch("employeeId") && 
    form.watch("originalDegree");

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
        <Button 
          variant="outline" 
          className="rounded-2xl h-12 px-8 font-bold mt-4"
          onClick={() => window.location.reload()}
        >
          Start New Submission
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-12 pb-20 mt-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Document <span className="text-primary">Submission</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Please provide your details and upload the required documents for verification. Ensure all copies are clear and original.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          {/* Personal Info Group */}
          <div className="glass-card p-8 md:p-10 rounded-[2.5rem] space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-50">
               <span className="text-[10px] font-mono tracking-widest text-muted-foreground">Session ID: {candidateId?.substring(0,8)}</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Personal Information <span className="text-red-500">*</span></h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <Input placeholder="John Doe" className="pl-12 h-14 rounded-2xl bg-accent/30 border-none focus-visible:ring-2 focus-visible:ring-primary/50 text-base font-medium" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employer"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Employer <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <Input placeholder="Tech Corp" className="pl-12 h-14 rounded-2xl bg-accent/30 border-none focus-visible:ring-2 focus-visible:ring-primary/50 text-base font-medium" {...field} />
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
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Mobile Number <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <Input placeholder="9876543210" className="pl-12 h-14 rounded-2xl bg-accent/30 border-none focus-visible:ring-2 focus-visible:ring-primary/50 text-base font-medium" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Employee ID <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <Input placeholder="EMP123" className="pl-12 h-14 rounded-2xl bg-accent/30 border-none focus-visible:ring-2 focus-visible:ring-primary/50 text-base font-medium" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Document Uploads Group */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-4">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <UploadCloud className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-black">Required Documents <span className="text-red-500">*</span></h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { type: "PHOTO", label: "Photograph", size: "20KB", icon: User },
                { type: "QUALIFICATION", label: "Qualification", size: "201KB", icon: FileText },
                { type: "ID_PROOF", label: "ID Proof", size: "25KB", icon: CreditCard },
                { type: "SIGNATURE", label: "Signature", size: "20KB", icon: CheckCircle2 },
              ].map((doc) => (
                <div key={doc.type} className="group">
                  <FileUpload 
                    candidateId={candidateId as string} 
                    type={doc.type as any} 
                    label={`${doc.label} (Max ${doc.size})`} 
                    maxSizeKB={parseInt(doc.size)} 
                    mandatory={true}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Consent Section */}
          <div className="space-y-6 pt-4">
              <FormField
                control={form.control}
                name="originalDegree"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-4 space-y-0 rounded-[2rem] border-2 border-primary/10 p-6 bg-primary/5 transition-colors hover:bg-primary/10">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="h-6 w-6 rounded-lg data-[state=checked]:bg-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-tight">
                      <FormLabel className="text-sm font-bold text-foreground cursor-pointer">
                        Crucial Confirmation <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormDescription className="text-xs font-medium text-muted-foreground">
                        I hereby solemnly affirm that the degree certificate being uploaded is the <span className="text-primary font-bold underline">Original Document</span> issued by the University, and not a provisional, temporary, or digital copy.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-center pt-6">
                <Button 
                    type="submit" 
                    size="lg"
                    className={`
                        premium-button h-16 px-12 rounded-[2rem] font-black text-lg transition-all
                        ${allFieldsFilled ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/40" : "bg-muted text-muted-foreground"}
                    `}
                    disabled={!allFieldsFilled || isSubmitting}
                >
                    {isSubmitting ? (
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Finalizing Submission...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6" />
                            Finalize Submission
                        </div>
                    )}
                </Button>
              </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
