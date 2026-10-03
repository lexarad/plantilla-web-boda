"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

type ToastDetail = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
};

const EVENT = "boda:toast";

export function toast(detail: Omit<ToastDetail, "id">) {
  if (typeof window === "undefined") return;
  const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  window.dispatchEvent(new CustomEvent<ToastDetail>(EVENT, { detail: { id, duration: 4000, ...detail } }));
}

export function ToastHost() {
  const [items, setItems] = useState<ToastDetail[]>([]);
  const [isCa, setIsCa] = useState(false);

  useEffect(() => {
    setIsCa(document.documentElement.lang === "ca");
  }, []);

  useEffect(() => {
    const timers = new Set<number>();
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      setItems((prev) => [...prev, detail]);
      const tid = window.setTimeout(() => {
        timers.delete(tid);
        setItems((prev) => prev.filter((item) => item.id !== detail.id));
      }, detail.duration ?? 4000);
      timers.add(tid);
    };
    window.addEventListener(EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(EVENT, handler as EventListener);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const dismiss = (id: string) => setItems((prev) => prev.filter((item) => item.id !== id));

  return (
    <div
      role="region"
      aria-label={isCa ? "Notificacions" : "Notificaciones"}
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2"
    >
      {items.map((item) => {
        const Icon = item.type === "success" ? CheckCircle2 : item.type === "error" ? XCircle : Info;
        const colors =
          item.type === "success"
            ? "border-success/40 text-success"
            : item.type === "error"
            ? "border-destructive/40 text-destructive"
            : "border-primary/40 bg-primary/5 text-primary";

        return (
          <div
            key={item.id}
            role={item.type === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-2xl border bg-card/95 p-3 shadow-panel backdrop-blur-xl animate-fade-up",
              colors
            )}
          >
            <Icon className="mt-0.5 size-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">{item.title}</p>
              {item.description ? (
                <p className="mt-0.5 text-xs opacity-80">{item.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label={isCa ? "Tancar" : "Cerrar"}
              onClick={() => dismiss(item.id)}
              className="rounded-md p-1 opacity-60 transition-opacity hover:opacity-100"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
