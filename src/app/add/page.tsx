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
import { Loader2, CheckCircle2, AlertCircle, MapPin, Building2, User, Phone, Hash } from "lucide-react";

const formSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  name: z.string().min(1, "Full name is required"),
  companyAgency: z.string().min(1, "Company/Agency name is required"),
  fullAddress: z.string().min(1, "Full address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Valid Pincode is required"),
});

export default function AddAddressPage() {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: "",
      phoneNumber: "",
      name: "",
      companyAgency: "",
      fullAddress: "",
      city: "",
      state: "",
      pincode: "",
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
    <div className="relative min-h-screen bg-black flex items-center justify-center p-6 py-20 text-white">
      <AnimatedBackground />
      
      <Card className="relative z-10 w-full max-w-2xl bg-black/60 border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden anim-fade-in group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
        
        <CardHeader className="p-8 pb-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 group-hover:scale-110 transition-transform duration-500">
              <MapPin className="h-7 w-7 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-3xl font-black text-white tracking-tight uppercase leading-none mb-1">Address Collection</CardTitle>
              <CardDescription className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Enterprise Data Portal &bull; Secure Protocol</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 pt-6">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-sm font-bold animate-pulse">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employee ID */}
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                        <Hash className="h-3 w-3 text-blue-400/50" /> Employee ID
                      </FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="EMP12345" 
                            className="bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-700 focus:bg-white/5 focus:border-blue-500/50 h-13 rounded-2xl transition-all shadow-inner" 
                            {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-black uppercase tracking-wider text-red-500" />
                    </FormItem>
                  )}
                />

                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                        <User className="h-3 w-3 text-blue-400/50" /> Full Name
                      </FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="John Doe" 
                            className="bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-700 focus:bg-white/5 focus:border-blue-500/50 h-13 rounded-2xl transition-all shadow-inner" 
                            {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-black uppercase tracking-wider text-red-500" />
                    </FormItem>
                  )}
                />

                {/* Phone Number */}
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                        <Phone className="h-3 w-3 text-blue-400/50" /> Mobile Number
                      </FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="+91 XXXXX XXXXX" 
                            className="bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-700 focus:bg-white/5 focus:border-blue-500/50 h-13 rounded-2xl transition-all shadow-inner" 
                            {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-black uppercase tracking-wider text-red-500" />
                    </FormItem>
                  )}
                />

                {/* Company/Agency */}
                <FormField
                  control={form.control}
                  name="companyAgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-blue-400/50" /> Organisation
                      </FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="Company or Agency Name" 
                            className="bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-700 focus:bg-white/5 focus:border-blue-500/50 h-13 rounded-2xl transition-all shadow-inner" 
                            {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-black uppercase tracking-wider text-red-500" />
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
                    <FormLabel className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-blue-400/50" /> Complete Mailing Address
                      </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="House No., Street, Floor, Landmark..." 
                        className="bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-700 focus:bg-white/5 focus:border-blue-500/50 h-13 rounded-2xl transition-all shadow-inner" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-black uppercase tracking-wider text-red-500" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* City */}
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em]">City</FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="District / City" 
                            className="bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-700 focus:bg-white/5 focus:border-blue-500/50 h-13 rounded-2xl transition-all shadow-inner" 
                            {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-black uppercase tracking-wider text-red-500" />
                    </FormItem>
                  )}
                />

                {/* State */}
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em]">State / Province</FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="Name of State" 
                            className="bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-700 focus:bg-white/5 focus:border-blue-500/50 h-13 rounded-2xl transition-all shadow-inner" 
                            {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-black uppercase tracking-wider text-red-500" />
                    </FormItem>
                  )}
                />

                {/* Pin Code */}
                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em]">Postal Code</FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="PIN Number" 
                            className="bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-700 focus:bg-white/5 focus:border-blue-500/50 h-13 rounded-2xl transition-all shadow-inner" 
                            {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-black uppercase tracking-wider text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-15 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xl rounded-[1.25rem] shadow-[0_0_50px_rgba(37,99,235,0.2)] hover:shadow-[0_0_80px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98] mt-6 border border-white/10 ring-1 ring-white/5"
              >
                {isSubmitting ? (
                  <Loader2 className="h-7 w-7 animate-spin px-1" />
                ) : (
                  "AUTHENTICATE & SUBMIT"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 whitespace-nowrap">
            &copy; {new Date().getFullYear()} CRUXDOC ENTERPRISE &bull; SECURE DATA VAULT
        </p>
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-blue-500/60">
            Military-Grade Encryption Active
        </p>
      </div>
    </div>
  );
}
