import type { MetadataRoute } from "next";
import { iniciales, nombresPareja } from "@/config/boda";
import { getWeddingDetails } from "@/lib/wedding-details";

// Manifest para "Añadir a pantalla de inicio" en el móvil.
export default function manifest(): MetadataRoute.Manifest {
  const d = getWeddingDetails("es");

  return {
    name: nombresPareja,
    short_name: iniciales,
    description: `${nombresPareja} · ${d.dateShort}`,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
