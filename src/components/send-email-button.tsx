"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { sendInvitationEmailAction } from "@/app/(admin)/invitados/email-actions";
import { Button } from "@/components/ui/button";

interface Props {
  guestId: string;
  hasEmail: boolean;
}

export function SendEmailButton({ guestId, hasEmail }: Props) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { ok?: boolean; message?: string } | null, formData: FormData) => {
      return sendInvitationEmailAction(formData);
    },
    null
  );

  return (
    <div className="grid gap-2">
      <form action={formAction}>
        <input name="guest_id" type="hidden" value={guestId} />
        <Button
          type="submit"
          variant="outline"
          disabled={pending || !hasEmail}
          className="w-full"
        >
          <Mail className="size-4" />
          {pending ? "Enviando…" : "Enviar invitación por correo"}
        </Button>
      </form>
      {!hasEmail && (
        <p className="text-xs text-muted-foreground">El invitado no tiene email registrado.</p>
      )}
      {state && (
        <p className={`text-xs font-medium ${state.ok ? "text-success" : "text-destructive"}`}>
          {state.message}
        </p>
      )}
    </div>
  );
}
