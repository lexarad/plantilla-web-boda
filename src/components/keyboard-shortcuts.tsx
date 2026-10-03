"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Estado de la secuencia "g" + tecla, para poder limpiarlo (antes cada "g"
    // apilaba un listener y un timeout huérfanos que nunca se retiraban al
    // desmontar ni al pulsar "g" repetidas veces).
    let seqListener: ((ev: KeyboardEvent) => void) | null = null;
    let seqTimeout: number | null = null;

    const clearSeq = () => {
      if (seqListener) window.removeEventListener("keydown", seqListener);
      if (seqTimeout !== null) window.clearTimeout(seqTimeout);
      seqListener = null;
      seqTimeout = null;
    };

    const handler = (event: KeyboardEvent) => {
      // Ignore when typing in input/textarea/select/contenteditable
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      // "/" -> Búsqueda global
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        router.push("/busqueda");
        return;
      }

      // "g" then "d" -> dashboard, "i" -> invitados, "m" -> mesas, "t" -> tareas
      if (event.key === "g") {
        clearSeq(); // cancelar cualquier secuencia previa pendiente
        seqListener = (ev: KeyboardEvent) => {
          const map: Record<string, string> = {
            d: "/dashboard",
            i: "/invitados",
            m: "/mesas",
            t: "/tareas",
            b: "/busqueda",
            c: "/cronograma",
            p: "/presupuesto"
          };
          const dest = map[ev.key.toLowerCase()];
          if (dest) {
            ev.preventDefault();
            router.push(dest);
          }
          clearSeq();
        };
        window.addEventListener("keydown", seqListener);
        seqTimeout = window.setTimeout(clearSeq, 1200);
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      clearSeq();
    };
  }, [router]);

  return null;
}
