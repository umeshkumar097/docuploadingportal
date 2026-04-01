"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/animated-background";
import { Loader2, CheckCircle2, AlertCircle, MapPin, Building2, User, Phone, Hash, RefreshCw } from "lucide-react";

const formSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  fullAddress: z.string().min(1, "Full address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Valid Pincode is required"),
  bookLanguage: z.string().min(1, "Book Language is required"),
});

const languages = [
  "Hindi", "Marathi", "Gujarati", "Tamil", "Telugu", "English", 
  "Assamese", "Malayalam", "Bangla", "Oria", "Kannada"
];

export default function AddAddressPage() {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: "",
      fullAddress: "",
      city: "",
      state: "",
      pincode: "",
      bookLanguage: "",
    },
  });

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/settings/form-status");
        const data = await res.json();
        setIsEnabled(data.enabled);
      } catch (err) {
        setIsEnabled(true); // Fallback to true
      }
    }
    checkStatus();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isEnabled === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className="relative min-h-screen bg-black flex items-center justify-center p-6 text-white">
        <AnimatedBackground />
        <Card className="relative z-10 w-full max-w-md bg-white/5 border-white/10 backdrop-blur-xl text-center shadow-2xl">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-white uppercase tracking-tight">Form Closed</CardTitle>
            <CardDescription className="text-zinc-500 font-medium">
              This specialized address collection form is currently inactive. Please contact your administrator if you believe this is an error.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="relative min-h-screen bg-black flex items-center justify-center p-6 text-white">
        <AnimatedBackground />
        <Card className="relative z-10 w-full max-w-md bg-white/5 border-white/10 backdrop-blur-xl text-center shadow-2xl">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-white uppercase tracking-tight">Success</CardTitle>
            <CardDescription className="text-zinc-400 font-medium">
              Your details have been moved to our secure central vault. Thank you for your cooperation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
                onClick={() => {
                  setIsSuccess(false);
                  form.reset();
                }}
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold h-12 rounded-xl transition-all"
            >
                Submit Another
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50/50 flex items-center justify-center p-6 py-20 text-slate-900 overflow-hidden">
      {/* Soft Light Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#e2e8f0_0%,#f8fafc_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      <Card className="relative z-10 w-full max-w-2xl bg-white border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden group rounded-[2rem]">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-600" />
        
        <CardHeader className="p-10 pb-4">
          <div className="flex items-center gap-5 mb-6">
            <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm">
              <MapPin className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-slate-900 tracking-tight leading-none mb-2">Address Collection</CardTitle>
              <CardDescription className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.25em]">Secure Enterprise Portal &bull; Verified Protocol</CardDescription>
            </div>
          </div>

          {/* System Instructions */}
          <div className="mt-4 p-5 bg-slate-50/80 rounded-[1.5rem] border border-slate-100/50 flex flex-col gap-3">
             <div className="flex items-center gap-2 text-[9px] font-black uppercase text-blue-600 tracking-widest pl-1">
                 <AlertCircle className="h-3 w-3" /> System Directives
             </div>
             <div className="space-y-3">
                <p className="text-[11px] font-semibold text-slate-600 leading-relaxed pl-1">
                    1. Enter your <span className="text-slate-900 font-black underline decoration-blue-500/30">Employee ID</span>.<br/>
                    2. Input your <span className="text-slate-900 font-black underline decoration-blue-500/30">delivery address</span>. All fields, including the Pincode, are mandatory. The system will block your submission if any field is left blank.<br/>
                    3. Select your <span className="text-slate-900 font-black underline decoration-blue-500/30">preferred language</span> for the books from the dropdown menu.<br/>
                    4. Click <span className="text-blue-600 font-black">Submit</span>.
                </p>
                <div className="pt-2 border-t border-slate-200/50 text-[10px] italic text-rose-500 font-bold pl-1">
                    * Ensure your address is accurate to avoid delivery failures. There is no workaround for missing data in this process.
                </div>
             </div>
          </div>
        </CardHeader>

        <CardContent className="p-10 pt-6">
          {error && (
            <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-sm font-bold">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Employee ID */}
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] flex items-center gap-2 mb-2">
                        <Hash className="h-3 w-3 text-slate-400" /> Employee ID <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="EMP12345" 
                            className="bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 h-14 rounded-xl transition-all shadow-sm" 
                            {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider text-red-500" />
                    </FormItem>
                  )}
                />

                {/* Book Language */}
                <FormField
                  control={form.control}
                  name="bookLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] flex items-center gap-2 mb-2">
                        <RefreshCw className="h-3 w-3 text-slate-400" /> Book Language <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <select 
                            className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 h-14 rounded-xl px-4 focus:bg-white focus:border-blue-500 transition-all shadow-sm outline-none appearance-none cursor-pointer font-medium"
                            {...field}
                        >
                          <option value="" disabled>Select Language</option>
                          {languages.map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Full Address */}
              <FormField
                control={form.control}
                name="fullAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] flex items-center gap-2 mb-2">
                      <MapPin className="h-3 w-3 text-slate-400" /> Complete Delivery Address <span className="text-red-500">*</span>
                      </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="House No., Street, Floor, Landmark..." 
                        className="bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 h-14 rounded-xl transition-all shadow-sm" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold uppercase tracking-wider text-red-500" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* City */}
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] mb-2">City <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="District / City" 
                            className="bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 h-14 rounded-xl transition-all shadow-sm" 
                            {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider text-red-500" />
                    </FormItem>
                  )}
                />

                {/* State */}
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] mb-2">State <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="Name of State" 
                            className="bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 h-14 rounded-xl transition-all shadow-sm" 
                            {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider text-red-500" />
                    </FormItem>
                  )}
                />

                {/* Pin Code */}
                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] mb-2">Postal Code <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="PIN Number" 
                            className="bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 h-14 rounded-xl transition-all shadow-sm" 
                            {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-15 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl transition-all active:scale-[0.99] mt-6 shadow-lg shadow-blue-200 border-0"
              >
                {isSubmitting ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : (
                  "AUTHENTICATE & SUBMIT"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity pointer-events-none">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400 whitespace-nowrap">
            &copy; {new Date().getFullYear()} CRUXDOC ENTERPRISE &bull; SECURE DATA INFRASTRUCTURE
        </p>
      </div>
    </div>
  );
}
