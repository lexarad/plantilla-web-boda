"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "light" | "dark" | "auto";

const STORAGE_KEY = "boda-theme";

function applyMode(mode: Mode) {
  if (typeof document === "undefined") return;
  const isDark =
    mode === "dark" ||
    (mode === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("auto");

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Mode | null) ?? "auto";
    setMode(stored);
    applyMode(stored);

    // Watch system preference if in auto mode
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      const current = (localStorage.getItem(STORAGE_KEY) as Mode | null) ?? "auto";
      if (current === "auto") applyMode("auto");
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  function update(next: Mode) {
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyMode(next);
  }

  const options: Array<{ value: Mode; icon: typeof Sun; label: string }> = [
    { value: "light", icon: Sun, label: "Claro" },
    { value: "auto", icon: Monitor, label: "Auto" },
    { value: "dark", icon: Moon, label: "Oscuro" }
  ];

  return (
    <div
      className="inline-flex rounded-full border border-border/60 bg-card/80 p-0.5 shadow-sm backdrop-blur"
      role="radiogroup"
      aria-label="Tema visual"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = mode === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.label}
            title={opt.label}
            onClick={() => update(opt.value)}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-full transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Inline script que corre antes de hidratar para evitar FOUC.
 *
 * El modo oscuro es una función SOLO del admin (el ThemeToggle vive en
 * admin-shell). La web pública usa el tema "base", que es siempre claro.
 * Por eso solo aplicamos `.dark` cuando
 * el usuario lo eligió EXPLÍCITAMENTE (stored === 'dark'), nunca por
 * preferencia del sistema: así prefers-color-scheme:dark no invierte la
 * paleta del público y deja el texto ilegible.
 */
export function ThemeNoFlashScript() {
  const script = `
    (function() {
      try {
        var key = '${STORAGE_KEY}';
        var stored = localStorage.getItem(key);
        if (stored === 'dark') document.documentElement.classList.add('dark');
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
