"use client";

import { useEffect, useRef, useState } from "react";

export function CountUp({
  to,
  duration = 1200,
  format,
  className
}: {
  to: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
}) {
  // Los conteos pequeños arrancan ya en su valor final: animar 0→1 deja una
  // ventana en la que el número contradice al badge de al lado («0 confirmado»
  // junto a «Todo confirmado») — inaceptable para lectura rápida.
  const [value, setValue] = useState(to <= 5 ? to : 0);
  const ref = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }

    const node = ref.current;
    if (!node) {
      setValue(to);
      return;
    }

    // Reinicia el flag para que un cambio de `to` vuelva a animar.
    startedRef.current = false;

    const animate = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(Math.round(to * eased));
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate();
            observer.unobserve(node);
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      // Cancela el frame pendiente al desmontar para no llamar setValue sobre
      // un componente desmontado ni dejar el rAF vivo.
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {format ? format(value) : value}
    </span>
  );
}
