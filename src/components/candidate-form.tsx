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
import { useState } from "react";
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
  FileText
} from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  employer: z.string().min(2, "Employer is required"),
  mobileNumber: z.string().min(10, "Valid mobile number is required"),
  employeeId: z.string().min(2, "Employee ID is required"),
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      employer: initialData?.employer || "",
      mobileNumber: initialData?.mobileNumber || "",
      employeeId: initialData?.employeeId || "",
      originalDegree: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    // Simulating API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(values);
    setIsSubmitting(false);
    setSubmitted(true);
  }

  const allFieldsFilled = 
    form.watch("name") && 
    form.watch("employer") && 
    form.watch("mobileNumber") && 
    form.watch("employeeId") && 
    form.watch("originalDegree");

  if (submitted) {
    return (
      <div className="glass-card p-12 rounded-3xl text-center space-y-6 animate-in zoom-in duration-500 max-w-lg mx-auto">
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-black text-foreground">Submission Complete!</h2>
        <p className="text-muted-foreground leading-relaxed">
          Your documents have been successfully uploaded and are now being reviewed by our verification team.
        </p>
        <Button 
          variant="outline" 
          className="rounded-2xl h-12 px-8 font-bold"
          onClick={() => window.location.reload()}
        >
          View Status
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
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
          <div className="glass-card p-8 md:p-10 rounded-[2.5rem] space-y-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</FormLabel>
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
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Employer</FormLabel>
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
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Mobile Number</FormLabel>
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
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Employee ID</FormLabel>
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
                <h3 className="text-2xl font-black">Required Documents</h3>
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
                    candidateId={candidateId} 
                    type={doc.type as any} 
                    label={`${doc.label} (Max ${doc.size})`} 
                    maxSizeKB={parseInt(doc.size)} 
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
                        Crucial Confirmation
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
                            Processing...
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
