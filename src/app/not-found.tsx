import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Página no encontrada</h1>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">Esta dirección no existe o ha cambiado.</p>
      <Button asChild className="rounded-md">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </main>
  );
}
