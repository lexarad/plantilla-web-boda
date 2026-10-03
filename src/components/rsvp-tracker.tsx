"use client";

import { useEffect } from "react";
import type { WeddingLocale } from "@/lib/wedding-details";

export function RsvpTracker({ token, locale }: { token: string; locale: WeddingLocale }) {
  useEffect(() => {
    const storageKey = `boda:rsvp-view:${token}`;

    if (typeof window !== "undefined" && window.sessionStorage.getItem(storageKey)) {
      return;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(storageKey, "1");
    }

    const controller = new AbortController();

    // La ruta lleva idioma desde que el idioma vive en la URL; sin el prefijo,
    // el middleware redirigía este POST y el registro se perdía.
    void fetch(`/${locale}/rsvp/${token}/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ lang: locale }),
      signal: controller.signal,
      keepalive: true
    }).catch(() => undefined);

    return () => controller.abort();
  }, [locale, token]);

  return null;
}
