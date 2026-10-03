"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

function computeDays(targetIso: string) {
  const diff = new Date(targetIso).getTime() - Date.now();
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
}

export function AdminCountdown({ targetIso }: { targetIso: string }) {
  const [days, setDays] = useState(() => computeDays(targetIso));

  useEffect(() => {
    const id = window.setInterval(() => setDays(computeDays(targetIso)), 60_000);
    return () => window.clearInterval(id);
  }, [targetIso]);

  if (days <= 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-sm font-semibold text-success shadow-sm">
        <Heart className="size-4 fill-current animate-pulse-soft" />
        ¡El gran día ha llegado!
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/8 to-primary/4 px-4 py-2.5 shadow-sm">
      <Heart className="size-4 shrink-0 text-primary/70 animate-pulse-soft" />
      <div>
        <span className="font-display text-3xl leading-none text-primary">{days}</span>
        <span className="ml-1.5 text-xs font-medium text-muted-foreground">días para la boda</span>
      </div>
    </div>
  );
}
