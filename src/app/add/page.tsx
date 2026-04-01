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
    <div className="relative min-h-screen bg-[#050505] flex items-center justify-center p-6 py-20 text-white overflow-hidden">
      {/* Premium Subtle Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a_0%,#050505_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <Card className="relative z-10 w-full max-w-2xl bg-[#0a0a0a] border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
        
        <CardHeader className="p-10 pb-0">
          <div className="flex items-center gap-5 mb-6">
            <div className="p-3.5 bg-white/[0.03] rounded-2xl border border-white/5 shadow-inner">
              <MapPin className="h-7 w-7 text-blue-400/80" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-white tracking-tight leading-none mb-2">Address Collection</CardTitle>
              <CardDescription className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.25em]">Secure Enterprise Portal &bull; ISO Protocol</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-10 pt-6">
          {error && (
            <div className="mb-8 p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center gap-3 text-red-500 text-sm font-bold">
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
                      <FormLabel className="text-zinc-500 font-bold uppercase text-[9px] tracking-[0.2em] flex items-center gap-2 mb-2">
                        <Hash className="h-3 w-3 text-zinc-600" /> Employee ID
                      </FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="EMP12345" 
                            className="bg-white/[0.02] border-white/10 text-white placeholder:text-zinc-800 focus:bg-white/[0.04] focus:border-blue-500/30 h-14 rounded-xl transition-all shadow-sm" 
                            {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider text-red-500/80" />
                    </FormItem>
                  )}
                />

                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-500 font-bold uppercase text-[9px] tracking-[0.2em] flex items-center gap-2 mb-2">
                        <User className="h-3 w-3 text-zinc-600" /> Full Name
                      </FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="John Doe" 
                            className="bg-white/[0.02] border-white/10 text-white placeholder:text-zinc-800 focus:bg-white/[0.04] focus:border-blue-500/30 h-14 rounded-xl transition-all shadow-sm" 
                            {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider text-red-500/80" />
                    </FormItem>
                  )}
                />

                {/* Phone Number */}
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-500 font-bold uppercase text-[9px] tracking-[0.2em] flex items-center gap-2 mb-2">
                        <Phone className="h-3 w-3 text-zinc-600" /> Mobile Number
                      </FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="+91 XXXXX XXXXX" 
                            className="bg-white/[0.02] border-white/10 text-white placeholder:text-zinc-800 focus:bg-white/[0.04] focus:border-blue-500/30 h-14 rounded-xl transition-all shadow-sm" 
                            {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider text-red-500/80" />
                    </FormItem>
                  )}
                />

                {/* Company/Agency */}
                <FormField
                  control={form.control}
                  name="companyAgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-500 font-bold uppercase text-[9px] tracking-[0.2em] flex items-center gap-2 mb-2">
                        <Building2 className="h-3 w-3 text-zinc-600" /> Organisation
                      </FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="Company or Agency Name" 
                            className="bg-white/[0.02] border-white/10 text-white placeholder:text-zinc-800 focus:bg-white/[0.04] focus:border-blue-500/30 h-14 rounded-xl transition-all shadow-sm" 
                            {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider text-red-500/80" />
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
                    <FormLabel className="text-zinc-500 font-bold uppercase text-[9px] tracking-[0.2em] flex items-center gap-2 mb-2">
                      <MapPin className="h-3 w-3 text-zinc-600" /> Complete Mailing Address
                      </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="House No., Street, Floor, Landmark..." 
                        className="bg-white/[0.02] border-white/10 text-white placeholder:text-zinc-800 focus:bg-white/[0.04] focus:border-blue-500/30 h-14 rounded-xl transition-all shadow-sm" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-black uppercase tracking-wider text-red-500/80" />
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
                      <FormLabel className="text-zinc-500 font-bold uppercase text-[9px] tracking-[0.2em] mb-2">City</FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="District / City" 
                            className="bg-white/[0.02] border-white/10 text-white placeholder:text-zinc-800 focus:bg-white/[0.04] focus:border-blue-500/30 h-14 rounded-xl transition-all shadow-sm" 
                            {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider text-red-500/80" />
                    </FormItem>
                  )}
                />

                {/* State */}
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-500 font-bold uppercase text-[9px] tracking-[0.2em] mb-2">State</FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="Name of State" 
                            className="bg-white/[0.02] border-white/10 text-white placeholder:text-zinc-800 focus:bg-white/[0.04] focus:border-blue-500/30 h-14 rounded-xl transition-all shadow-sm" 
                            {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider text-red-500/80" />
                    </FormItem>
                  )}
                />

                {/* Pin Code */}
                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-500 font-bold uppercase text-[9px] tracking-[0.2em] mb-2">Postal Code</FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="PIN Number" 
                            className="bg-white/[0.02] border-white/10 text-white placeholder:text-zinc-800 focus:bg-white/[0.04] focus:border-blue-500/30 h-14 rounded-xl transition-all shadow-sm" 
                            {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider text-red-500/80" />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-15 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-2xl transition-all active:scale-[0.99] mt-6 shadow-lg shadow-blue-500/10 border border-blue-400/20"
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
      
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-20 hover:opacity-50 transition-opacity pointer-events-none">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-400 whitespace-nowrap">
            &copy; {new Date().getFullYear()} CRUXDOC ENTERPRISE &bull; SECURE DATA ARCHITECTURE
        </p>
      </div>
    </div>
  );
}
