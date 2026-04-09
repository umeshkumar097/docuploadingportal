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
  Building
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
