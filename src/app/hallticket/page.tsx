"use client";

import { useState } from "react";
import { Search, Download, AlertCircle, FileText, ChevronRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function HallTicketPublicPage() {
  const [hallTicketNumber, setHallTicketNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // New state for ticket details
  const [ticketData, setTicketData] = useState<{ number: string; filePath: string; lastDownloadedAt: string | null } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hallTicketNumber.trim()) {
      setError("Please enter a valid Hall Ticket Number");
      return;
    }

    setIsLoading(true);
    setError("");
    setTicketData(null);

    try {
      const res = await fetch(`/api/hallticket/search?number=${encodeURIComponent(hallTicketNumber.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to find hall ticket");
      }

      setTicketData({
        number: hallTicketNumber.trim(),
        filePath: data.filePath,
        lastDownloadedAt: data.lastDownloadedAt
      });
      
      toast.success("Hall Ticket found!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!ticketData) return;
    
    // Trigger download visually
    window.open(ticketData.filePath, "_blank");

    // Log it
    try {
      await fetch("/api/hallticket/log-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: ticketData.number }),
      });
      // Optionally update local state to show it was downloaded just now
      setTicketData(prev => prev ? { ...prev, lastDownloadedAt: new Date().toISOString() } : null);
    } catch (err) {
      console.error("Failed to log download", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6 backdrop-blur-xl shadow-2xl">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Hall Ticket Portal</h1>
          <p className="text-zinc-400">Download your examination hall ticket instantly.</p>
        </div>

        <div className="glass-card p-1 sm:p-2 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-2xl shadow-2xl">
          <div className="p-6 sm:p-8 bg-zinc-950/50 rounded-[1.7rem]">
            <form onSubmit={handleSearch} className="space-y-6">
              
              <AnimatePresence mode="wait">
                {!ticketData ? (
                  <motion.div
                    key="search-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300 ml-1">Hall Ticket Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <ShieldCheck className="h-5 w-5 text-zinc-500" />
                        </div>
                        <Input 
                          type="text" 
                          placeholder="Enter your 9-digit number" 
                          value={hallTicketNumber}
                          onChange={(e) => setHallTicketNumber(e.target.value)}
                          className="pl-11 h-14 bg-black/50 border-white/10 text-white text-lg rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all placeholder:text-zinc-600"
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 mt-4">
                            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-200">{error}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg tracking-wide transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group mt-6"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Searching...</span>
                        </div>
                      ) : (
                        <>
                          <span>Search Hall Ticket</span>
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="ticket-details"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="p-5 bg-black/40 border border-white/10 rounded-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-zinc-400">Status</span>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                          Ready for Download
                        </span>
                      </div>
                      
                      <div className="space-y-1 mb-4">
                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Hall Ticket Number</p>
                        <p className="text-2xl font-black text-white tracking-widest">{ticketData.number}</p>
                      </div>

                      {ticketData.lastDownloadedAt && (
                        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-start gap-3">
                          <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-blue-400 uppercase">Last Downloaded</p>
                            <p className="text-sm text-blue-200 mt-0.5">
                              {new Date(ticketData.lastDownloadedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setTicketData(null)}
                        className="flex-1 h-12 bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      >
                        Back
                      </Button>
                      <Button 
                        type="button" 
                        onClick={handleDownload}
                        className="flex-[2] h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wide shadow-lg shadow-emerald-500/20 gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Download PDF
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-500 mt-8">
          Secure Download Portal &copy; {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}
