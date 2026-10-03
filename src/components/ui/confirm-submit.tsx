"use client";

import type { MouseEvent, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Botón submit destructivo: pide confirmación nativa antes de enviar y muestra
 * estado pending. Política única de borrado del panel — todo delete pasa por aquí.
 */
export function ConfirmSubmit({
  children = "Eliminar",
  confirmText = "¿Eliminar? Esta acción no se puede deshacer.",
  pendingText = "Eliminando…",
  className,
  size = "default"
}: {
  children?: ReactNode;
  /** Mensaje del confirm() nativo; siempre en primera persona clara. */
  confirmText?: string;
  pendingText?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}) {
  const { pending } = useFormStatus();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    // Si cancela, abortamos el envío del form antes de que llegue al server action.
    if (!window.confirm(confirmText)) {
      event.preventDefault();
    }
  }

  return (
    <Button
      type="submit"
      variant="destructive"
      size={size}
      className={cn(className)}
      onClick={handleClick}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
