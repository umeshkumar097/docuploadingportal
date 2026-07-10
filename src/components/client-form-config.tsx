"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Settings2, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  MapPin,
  Languages,
  BookOpen,
  Building,
  CreditCard,
  Clock,
  RotateCw
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ClientFormConfigProps {
  clientId: string;
  initialConfig: any;
  initialCenters: string[];
}

const FIELD_OPTIONS = [
  { id: "addressLine1", label: "Address Line 1", icon: MapPin },
  { id: "addressLine2", label: "Street", icon: MapPin },
  { id: "city", label: "City", icon: Building },
  { id: "state", label: "State", icon: Building },
  { id: "pincode", label: "Pin Code", icon: MapPin },
  { id: "bookLanguage", label: "Book Language", icon: BookOpen },
  { id: "trainingLanguage", label: "Training Language", icon: Languages },
  { id: "examCenter", label: "Exam Center", icon: MapPin },
];

export function ClientFormConfig({ clientId, initialConfig, initialCenters }: ClientFormConfigProps) {
  const [config, setConfig] = useState(initialConfig || {});
  const [centers, setCenters] = useState<string[]>(initialCenters || []);
  const [newCenter, setNewCenter] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  const getCorrectionValue = () => {
    if (!config.correctionUntil) return "DISABLED";
    if (config.correctionUntil === "ALWAYS") return "ALWAYS";
    
    const until = new Date(config.correctionUntil);
    if (until.getTime() <= Date.now()) {
      return "DISABLED";
    }
    
    return "ACTIVE";
  };

  const handleCorrectionWindowChange = (val: string) => {
    if (val === "DISABLED") {
      setConfig((prev: any) => {
        const next = { ...prev };
        delete next.correctionUntil;
        return next;
      });
    } else if (val === "ALWAYS") {
      setConfig((prev: any) => ({
        ...prev,
        correctionUntil: "ALWAYS"
      }));
    } else {
      let durationMs = 0;
      if (val === "1H") durationMs = 60 * 60 * 1000;
      else if (val === "2H") durationMs = 2 * 60 * 60 * 1000;
      else if (val === "12H") durationMs = 12 * 60 * 60 * 1000;
      else if (val === "24H") durationMs = 24 * 60 * 60 * 1000;

      setConfig((prev: any) => ({
        ...prev,
        correctionUntil: new Date(Date.now() + durationMs).toISOString()
      }));
    }
  };

  const formatRemainingTime = (isoString: string) => {
    const until = new Date(isoString).getTime();
    const diffMs = until - Date.now();
    if (diffMs <= 0) return "Expired";
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    return `${diffHours}h ${remainingMins}m`;
  };

  const handleStatusChange = (fieldId: string, status: string) => {
    setConfig((prev: any) => ({
      ...prev,
      [fieldId]: status
    }));
  };

  const addCenter = () => {
    if (!newCenter.trim()) return;
    if (centers.includes(newCenter.trim())) {
      toast.error("Center already exists");
      return;
    }
    setCenters([...centers, newCenter.trim()]);
    setNewCenter("");
  };

  const removeCenter = (index: number) => {
    setCenters(centers.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formConfig: config,
          examCenters: centers
        })
      });

      if (res.ok) {
        toast.success("Form configuration saved successfully");
      } else {
        toast.error("Failed to save configuration");
      }
    } catch (error) {
      toast.error("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Settings2 className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-bold uppercase tracking-tight">Form Field Settings</h3>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="rounded-2xl h-12 px-8 font-bold shadow-lg shadow-primary/20 bg-primary text-primary-foreground"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Configuration
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {FIELD_OPTIONS.map((field) => (
          <Card key={field.id} className="p-5 rounded-3xl border border-primary/5 bg-background shadow-sm space-y-4 hover:border-primary/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent text-primary">
                <field.icon className="h-4 w-4" />
              </div>
              <span className="font-bold text-sm text-foreground">{field.label}</span>
            </div>
            
            <Select 
              value={config[field.id] || "DISABLED"} 
              onValueChange={(val) => handleStatusChange(field.id, val)}
            >
              <SelectTrigger className="w-full h-11 rounded-xl bg-accent/30 border-none font-semibold text-xs transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-primary/10 shadow-xl">
                <SelectItem value="DISABLED" className="text-muted-foreground font-medium">Disabled</SelectItem>
                <SelectItem value="OPTIONAL" className="text-amber-600 font-bold">Enabled (Optional)</SelectItem>
                <SelectItem value="MANDATORY" className="text-emerald-600 font-black">Enabled (Mandatory)</SelectItem>
              </SelectContent>
            </Select>
          </Card>
        ))}
      </div>

      {/* Employee ID Required toggle */}
      <Card className="p-5 rounded-3xl border border-primary/5 bg-background shadow-sm space-y-4 hover:border-primary/20 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent text-primary">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground">Employee ID Required for Lookup</span>
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Sirf Employee ID se lookup hoga. Phone number master data mein nahi hoga toh user manually bharega.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfig((prev: any) => ({ ...prev, requireEmpIdForLookup: !prev?.requireEmpIdForLookup }))}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
              config?.requireEmpIdForLookup ? "bg-primary" : "bg-muted"
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
              config?.requireEmpIdForLookup ? "translate-x-6" : "translate-x-0"
            }`} />
          </button>
        </div>
      </Card>

      {/* Global Correction Window Setting */}
      <Card className="p-5 rounded-3xl border border-primary/5 bg-background shadow-sm space-y-4 hover:border-primary/20 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent text-primary">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground">Global Correction Window</span>
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                Enable a temporary window for all submitted candidates of this client to re-upload documents.
              </p>
            </div>
          </div>
          
          <div className="w-full md:w-60">
            <Select 
              value={getCorrectionValue()} 
              onValueChange={handleCorrectionWindowChange}
            >
              <SelectTrigger className="w-full h-11 rounded-xl bg-accent/30 border-none font-semibold text-xs transition-all">
                <SelectValue placeholder="Select Duration" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-primary/10 shadow-xl">
                <SelectItem value="DISABLED">Disabled (Default)</SelectItem>
                {getCorrectionValue() === "ACTIVE" && (
                  <SelectItem value="ACTIVE">Currently Active</SelectItem>
                )}
                <SelectItem value="1H">1 Hour</SelectItem>
                <SelectItem value="2H">2 Hours</SelectItem>
                <SelectItem value="12H">12 Hours</SelectItem>
                <SelectItem value="24H">24 Hours</SelectItem>
                <SelectItem value="ALWAYS">Always Enabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {config.correctionUntil && config.correctionUntil !== "ALWAYS" && new Date(config.correctionUntil).getTime() > Date.now() && (
          <div className="flex items-center gap-2 text-xs text-amber-600 font-bold bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
            <RotateCw className="h-4 w-4 shrink-0 animate-spin" />
            <span>
              Active until: {new Date(config.correctionUntil).toLocaleString()} (Remaining: {formatRemainingTime(config.correctionUntil)})
            </span>
          </div>
        )}
      </Card>

      {config.examCenter !== "DISABLED" && (
        <Card className="p-8 rounded-[2.5rem] border border-primary/10 bg-accent/20 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Client Exam Centers</h3>
                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Candidates will select from these options</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Input 
              placeholder="Enter center name (e.g. New Delhi, Building 4)" 
              value={newCenter}
              onChange={(e) => setNewCenter(e.target.value)}
              className="h-14 rounded-2xl bg-background border-none shadow-inner font-semibold"
              onKeyDown={(e) => e.key === 'Enter' && addCenter()}
            />
            <Button onClick={addCenter} className="h-14 rounded-2xl px-6 bg-primary font-bold shadow-lg shadow-primary/10">
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {centers.map((center, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-background rounded-2xl border border-primary/5 group animate-in slide-in-from-top-2 duration-300">
                <span className="font-bold text-sm truncate">{center}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeCenter(idx)}
                  className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {centers.length === 0 && (
              <div className="col-span-full py-8 text-center bg-background/50 rounded-3xl border-2 border-dashed border-primary/10">
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">No Exam Centers Added Yet</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
