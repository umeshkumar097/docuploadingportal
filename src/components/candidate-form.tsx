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
import { useState, useEffect } from "react";
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
  AlertCircle
} from "lucide-react";

const formSchema = z.object({
  name: z.string()
    .min(2, "Name as per ID Proof is required")
    .regex(/^(?![0-9.\-/]*$)[a-zA-Z0-9\s.]+$/, "Please enter your full name (dates or numbers not allowed)"),
  employer: z.string().min(2, "Employer is required"),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, "10-digit mobile number is required"),
  employeeId: z.string().min(2, "Employee ID is required"),
  residentialState: z.string().min(2, "Residential State is required"),
  city: z.string().min(2, "City is required"),
  pincode: z.string().regex(/^[0-9]{6}$/, "Pincode must be exactly 6 digits"),
  phase: z.string().optional(),
  idType: z.enum(["PAN", "AADHAAR", "DL", "PASSPORT"], {
    message: "Please select an ID type",
  }),
  idNumber: z.string().optional(),
  originalDegree: z.boolean().refine((val) => val === true, {
    message: "You must confirm this is an original certificate",
  }),
});

interface CandidateFormProps {
  candidateId: string;
  initialData?: any;
}

export function CandidateForm({ candidateId, initialData }: CandidateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      employer: initialData?.employer || "",
      mobileNumber: initialData?.mobileNumber || "",
      employeeId: initialData?.employeeId || "",
      residentialState: initialData?.residentialState || "",
      city: initialData?.city || "",
      pincode: initialData?.pincode || "",
      phase: initialData?.phase || "Phase 1",
      idType: initialData?.idType || "" as any,
      idNumber: initialData?.idNumber || "",
      originalDegree: false,
    },
  });

  useEffect(() => {
    if (initialData?.documents) {
      setUploadedDocs(new Set(initialData.documents.map((d: any) => d.type)));
    }
  }, [initialData]);

  // Auto-Save Debouncer (Same as Public Form)
  useEffect(() => {
    const subscription = form.watch((value) => {
      const token = initialData?.token;
      if (!token) return;
      
      const timer = setTimeout(async () => {
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
      return () => clearTimeout(timer);
    });
    return () => subscription.unsubscribe();
  }, [form, initialData]);

  const handleUploadSuccess = (type: string) => {
    setUploadedDocs(prev => new Set([...prev, type]));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const token = initialData?.token;
      if (!token) return;

      await fetch(`/api/candidate/${token}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "COMPLETED" })
      });
      
      setSubmitted(true);
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

  const allDocsUploaded = 
    uploadedDocs.has("PHOTO") && 
    uploadedDocs.has("QUALIFICATION") && 
    uploadedDocs.has("ID_PROOF") && 
    uploadedDocs.has("SIGNATURE");

  const isFormReady = allFieldsFilled && allDocsUploaded;

  if (submitted) {
    return (
      <div className="glass-card p-12 rounded-[3rem] text-center space-y-8 max-w-2xl mx-auto shadow-2xl backdrop-blur-2xl border-white/40">
        <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-foreground">Submission Complete!</h2>
          <p className="text-muted-foreground text-lg italic">
            Your documents have been successfully uploaded and are now being reviewed.
          </p>
        </div>
        <Button variant="outline" className="rounded-2xl h-14 px-10 font-bold mt-4" onClick={() => window.location.reload()}>
          View Status
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Document <span className="text-primary">Submission</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto italic font-medium">
          Ensure all copies are clear and original.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          <div className="glass-card p-8 md:p-10 rounded-[2.5rem] space-y-8 relative overflow-hidden">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Name per ID Proof</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <Input placeholder="Enter Name" className="pl-12 h-14 rounded-2xl bg-accent/30 border-none focus-visible:ring-2 focus-visible:ring-primary/50 text-base font-semibold" {...field} />
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
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Employer/Company</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <Input placeholder="Enter Company" className="pl-12 h-14 rounded-2xl bg-accent/30 border-none focus-visible:ring-2 focus-visible:ring-primary/50 text-base font-semibold" {...field} />
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
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Mobile Number</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <Input maxLength={10} placeholder="Enter Mobile" className="pl-12 h-14 rounded-2xl bg-accent/30 border-none focus-visible:ring-2 focus-visible:ring-primary/50 text-base font-semibold" {...field} />
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
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Employee ID</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <Input placeholder="Enter ID" className="pl-12 h-14 rounded-2xl bg-accent/30 border-none focus-visible:ring-2 focus-visible:ring-primary/50 text-base font-semibold" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="residentialState"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">State</FormLabel>
                    <FormControl><Input className="h-14 rounded-2xl bg-accent/30 border-none px-6 font-semibold" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">City</FormLabel>
                    <FormControl><Input className="h-14 rounded-2xl bg-accent/30 border-none px-6 font-semibold" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Pincode</FormLabel>
                    <FormControl><Input maxLength={6} className="h-14 rounded-2xl bg-accent/30 border-none px-6 font-semibold" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="idType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">ID Type</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full h-14 rounded-2xl bg-accent/30 border-none px-6 appearance-none font-semibold text-foreground">
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
              <FormField
                control={form.control}
                name="idNumber"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">ID Number</FormLabel>
                    <FormControl><Input className="h-14 rounded-2xl bg-accent/30 border-none px-6 font-semibold" {...field} /></FormControl>
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
                <h3 className="text-2xl font-black uppercase italic">Required Documents</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FileUpload candidateId={candidateId} type="PHOTO" label="Photograph" maxSizeKB={10240} mandatory={true} initialSuccess={uploadedDocs.has("PHOTO")} onUploadSuccess={handleUploadSuccess} />
              <FileUpload candidateId={candidateId} type="QUALIFICATION" label="Qualification" maxSizeKB={10240} mandatory={true} initialSuccess={uploadedDocs.has("QUALIFICATION")} onUploadSuccess={handleUploadSuccess} />
              <FileUpload candidateId={candidateId} type="ID_PROOF" label="Identity Proof" maxSizeKB={10240} mandatory={true} initialSuccess={uploadedDocs.has("ID_PROOF")} onUploadSuccess={handleUploadSuccess} />
              <FileUpload candidateId={candidateId} type="SIGNATURE" label="Signature" maxSizeKB={10240} mandatory={true} initialSuccess={uploadedDocs.has("SIGNATURE")} onUploadSuccess={handleUploadSuccess} />
            </div>
          </div>

          <div className="space-y-8">
            <FormField
              control={form.control}
              name="originalDegree"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-5 space-y-0 rounded-[2.5rem] border-2 border-emerald-500/30 p-8 bg-emerald-500/5 transition-colors hover:bg-emerald-500/10">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-8 w-8 rounded-lg mt-1" /></FormControl>
                  <div className="space-y-2 leading-tight">
                    <FormLabel className="text-lg font-black text-emerald-900 uppercase">Original Certificate Confirmation</FormLabel>
                    <FormDescription className="text-sm font-bold text-emerald-800/70">I confirm these are original copies.</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-center flex-col items-center gap-4">
              <Button 
                  type="submit" 
                  disabled={!isFormReady || isSubmitting}
                  className={`h-20 px-16 rounded-[2.5rem] font-black text-xl shadow-2xl transition-all hover:scale-105 active:scale-95 ${isFormReady ? "bg-primary text-primary-foreground shadow-primary/40" : "bg-muted text-muted-foreground opacity-50"}`}
              >
                {isSubmitting ? "Finalizing..." : "Finalize Submission"}
              </Button>
              {!isFormReady && !isSubmitting && (
                  <p className="text-xs font-bold text-red-500 uppercase tracking-widest animate-pulse flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Complete all fields & uploads to finalize
                  </p>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
