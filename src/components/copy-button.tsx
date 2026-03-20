"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link2, Check, Copy } from "lucide-react";

interface CopyButtonProps {
  token: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "icon" | "lg";
  className?: string;
  showText?: boolean;
}

export function CopyButton({ 
  token, 
  variant = "ghost", 
  size = "sm", 
  className = "",
  showText = false
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    const url = `${window.location.origin}/submit/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={copyToClipboard}
      className={`rounded-xl transition-all font-bold gap-2 ${className} ${
        copied ? "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-600" : ""
      }`}
    >
      {copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {showText && (copied ? "Copied!" : "Copy Link")}
      {!showText && !copied && <span className="sr-only">Copy Link</span>}
    </Button>
  );
}
