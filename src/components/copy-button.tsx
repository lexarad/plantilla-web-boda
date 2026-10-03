"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast-host";

export function CopyButton({
  text,
  label = "Copiar",
  copiedLabel = "¡Copiado!",
  size = "sm",
  variant = "outline"
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "secondary" | "ghost" | "outline" | "destructive";
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ type: "success", title: copiedLabel, description: text.slice(0, 60) });
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ type: "error", title: "Error", description: "No se pudo copiar" });
      console.error("CopyButton error", error);
    }
  };

  return (
    <Button type="button" size={size} variant={copied ? "secondary" : variant} onClick={onCopy}>
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? copiedLabel : label}
    </Button>
  );
}
