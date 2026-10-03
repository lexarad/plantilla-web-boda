"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  pendingText,
  className,
  size = "default"
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size={size} className={cn(className)} disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {pendingText ?? "Guardando…"}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
