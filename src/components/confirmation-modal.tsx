"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "success";
  loading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
}: ConfirmationModalProps) {
  const icons = {
    default: <Info className="h-6 w-6 text-primary" />,
    destructive: <AlertTriangle className="h-6 w-6 text-destructive" />,
    success: <CheckCircle2 className="h-6 w-6 text-emerald-500" />,
  };

  const ringColors = {
    default: "bg-primary/10 text-primary ring-primary/20",
    destructive: "bg-destructive/10 text-destructive ring-destructive/20",
    success: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] border-primary/10 bg-background/95 backdrop-blur-xl shadow-2xl p-8 overflow-hidden gap-6">
        <DialogHeader className="items-center text-center gap-4">
          <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center ring-4", ringColors[variant])}>
            {icons[variant]}
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-black tracking-tight">{title}</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium text-sm leading-relaxed px-2">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-3 -mx-4 -mb-4 p-6 bg-muted/30 border-t border-primary/5 mt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-2xl h-12 font-bold hover:bg-black/5 dark:hover:bg-white/5 order-last sm:order-first"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex-1 rounded-2xl h-12 font-black shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]",
              variant === "success" && "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20",
              variant === "destructive" && "bg-red-600 hover:bg-red-700 shadow-red-500/20",
              variant === "default" && "bg-primary hover:bg-primary/90 shadow-primary/20"
            )}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
