"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast-host";

export function CopyIbanButton({
  iban,
  label,
  copiedLabel,
  errorTitle = "No se pudo copiar",
  errorDescription = "Inténtalo de nuevo"
}: {
  iban: string;
  label: string;
  copiedLabel: string;
  errorTitle?: string;
  errorDescription?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(iban.replace(/\s/g, ""));
      setCopied(true);
      toast({ type: "success", title: copiedLabel, description: iban });
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ type: "error", title: errorTitle, description: errorDescription });
      console.error("No se pudo copiar el IBAN", error);
    }
  };

  return (
    <Button type="button" onClick={handleCopy} variant={copied ? "secondary" : "default"} size="sm">
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? copiedLabel : label}
    </Button>
  );
}
