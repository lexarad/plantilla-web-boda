"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="size-8 text-destructive" aria-hidden />
      <h1 className="font-display text-3xl font-semibold tracking-tight">Algo ha fallado</h1>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        No se ha podido cargar esta página. Vuelve a intentarlo o regresa al inicio.
      </p>
      {error.digest ? <p className="text-xs text-muted-foreground">Referencia: {error.digest}</p> : null}
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" className="rounded-md" onClick={() => reset()}>
          <RotateCcw className="size-4" />
          Reintentar
        </Button>
        <Button asChild variant="outline" className="rounded-md">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Ir al inicio
          </Link>
        </Button>
      </div>
    </main>
  );
}
