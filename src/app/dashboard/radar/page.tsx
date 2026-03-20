"use client";

import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Clock, 
  MessageCircle,
  Smartphone,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  CreditCard
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Document types we expect
const REQUIRED_DOCS = [
  { type: "PHOTO", label: "Photo", icon: User },
  { type: "ID_PROOF", label: "ID Proof", icon: CreditCard },
  { type: "QUALIFICATION", label: "Degree", icon: FileText },
  { type: "SIGNATURE", label: "Sign", icon: CheckCircle2 },
];

export default function LiveRadarPage() {
  const { data, error, isLoading } = useSWR("/api/ops/radar", fetcher, { 
    refreshInterval: 5000, // Poll every 5 seconds
    revalidateOnFocus: true 
  });

  if (error) {
    return <div className="p-8 text-center text-red-500 font-bold">Failed to load live radar data.</div>;
  }

  const candidates = data?.candidates || [];

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl flex items-center gap-4">
            Live <span className="text-rose-500">Radar</span>
            <div className="relative flex h-5 w-5 ml-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-500 items-center justify-center">
                <Activity className="h-3 w-3 text-white" />
              </span>
            </div>
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">
            Real-time monitoring of actively onboarding candidates.
          </p>
        </div>
        <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col items-end mr-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Active Sessions</span>
                <span className="text-xs font-black text-rose-500 flex items-center gap-1 text-2xl">
                    {candidates.length}
                </span>
            </div>
        </div>
      </div>

      {isLoading && candidates.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-muted-foreground animate-pulse font-bold">
          Scanning for active sessions...
        </div>
      ) : candidates.length === 0 ? (
        <div className="glass-card p-16 text-center space-y-4 rounded-3xl animate-in fade-in duration-500">
          <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <h3 className="text-2xl font-bold">No Active Sweeps</h3>
          <p className="text-muted-foreground">There are currently no candidates interacting with the public form.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {candidates.map((candidate: any) => {
            const lastActive = new Date(candidate.lastActiveAt);
            const isVeryStuck = Date.now() - lastActive.getTime() > 5 * 60 * 1000; // 5 mins
            const uploadedTypes = candidate.documents?.map((d: any) => d.type) || [];
            const completionPercentage = (uploadedTypes.length / 4) * 100;
            const phoneNumberRaw = candidate.mobileNumber?.replace(/\D/g, "");

            return (
              <div key={candidate.id} className="glass-card rounded-[2rem] p-6 relative overflow-hidden flex flex-col h-full hover:scale-[1.02] transition-transform duration-300">
                {/* Status Indicator */}
                <div className="absolute top-0 left-0 w-full h-1 bg-accent overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${isVeryStuck ? "bg-amber-500" : "bg-emerald-500"}`} 
                    style={{ width: `${Math.max(completionPercentage, 5)}%` }} 
                  />
                </div>

                <div className="flex justify-between items-start mb-6 pt-2">
                  <div>
                    <h3 className="text-xl font-black text-foreground truncate max-w-[200px]">
                      {candidate.name || "Anonymous User"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Smartphone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-mono text-muted-foreground tracking-widest">
                        {candidate.mobileNumber || "Entering digits..."}
                      </span>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`font-bold uppercase tracking-wider text-[9px] px-2 py-1 ${isVeryStuck ? "text-amber-500 border-amber-500/30 bg-amber-500/10" : "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"}`}
                  >
                    {isVeryStuck ? "Stuck" : "Active"}
                  </Badge>
                </div>

                {/* Progress Details */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span>Documents</span>
                    <span className="text-foreground">{uploadedTypes.length}/4</span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {REQUIRED_DOCS.map((doc) => {
                      const isUploaded = uploadedTypes.includes(doc.type);
                      return (
                        <div 
                          key={doc.type} 
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${
                            isUploaded 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 shadow-inner" 
                              : "bg-accent/40 border-dashed border-accent hover:border-accent-foreground/20 text-muted-foreground"
                          }`}
                          title={doc.label}
                        >
                          <doc.icon className={`h-4 w-4 mb-1 ${isUploaded ? "opacity-100" : "opacity-40"}`} />
                          <span className="text-[8px] font-black uppercase tracking-tighter truncate w-full text-center">
                            {doc.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="text-xs font-medium text-muted-foreground bg-accent/30 p-3 rounded-xl flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>
                      {candidate.currentStep === "STARTED" ? "Just opened the form" : 
                       candidate.currentStep === "PERSONAL_INFO_DONE" ? "Finished typing personal info" : 
                       candidate.currentStep === "UPLOADING_DOCS" ? "Currently dropping files" : 
                       "Processing..."}
                    </span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-6 pt-4 border-t border-accent flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">
                    Active {formatDistanceToNow(lastActive, { addSuffix: true })}
                  </span>
                  
                  <Button 
                    size="sm" 
                    variant={isVeryStuck ? "default" : "secondary"}
                    className={`rounded-xl font-bold gap-1 shadow-none transition-all ${
                      isVeryStuck && phoneNumberRaw ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : ""
                    }`}
                    disabled={!phoneNumberRaw}
                    onClick={() => {
                      if (phoneNumberRaw) {
                        window.open(`https://wa.me/91${phoneNumberRaw}?text=Hi ${candidate.name || "there"}, I saw you were applying. Do you need any help uploading your documents?`, "_blank");
                      }
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
