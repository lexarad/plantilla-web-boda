"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    console.error(error);
    // Anunciar y enfocar el error para lectores de pantalla y teclado.
    headingRef.current?.focus();
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <Card role="alert" className="w-full max-w-md border-destructive/30 bg-destructive/5">
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-7" />
          </span>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-destructive">Algo no ha ido bien</p>
            <h1 ref={headingRef} tabIndex={-1} className="font-display text-3xl leading-tight outline-none">Se ha producido un error</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              No hemos podido cargar esta página del panel. Puedes intentarlo de nuevo o volver al inicio.
            </p>
            {error.digest ? (
              <p className="pt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                Referencia: {error.digest}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={() => reset()}>
              <RotateCcw className="size-4" />
              Reintentar
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="size-4" />
                Volver al inicio
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
