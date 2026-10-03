import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Botón único de WhatsApp (antes duplicado literal en invitados y grupos).
 * Abre el enlace `wa.me` en pestaña nueva con el tono de éxito por token.
 */
export function WhatsAppButton({
  href,
  children = "WhatsApp",
  variant = "outline",
  size = "default",
  iconOnly = false,
  label = "Enviar por WhatsApp",
  className
}: {
  href: string;
  children?: ReactNode;
  variant?: "outline" | "ghost";
  size?: "default" | "sm" | "icon";
  /** Sólo icono: oculta el texto y usa `label` como aria-label. */
  iconOnly?: boolean;
  /** aria-label; imprescindible cuando `iconOnly`. */
  label?: string;
  className?: string;
}) {
  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={cn("border-success/40 text-success hover:bg-success/10", className)}
    >
      <a
        href={href}
        rel="noreferrer"
        target="_blank"
        aria-label={iconOnly ? label : undefined}
        title={iconOnly ? label : undefined}
      >
        <MessageCircle aria-hidden="true" />
        {iconOnly ? null : children}
      </a>
    </Button>
  );
}
