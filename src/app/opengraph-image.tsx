import { ImageResponse } from "next/og";
import { nombresPareja } from "@/config/boda";
import { getWeddingDetails } from "@/lib/wedding-details";

// Imagen que aparece al compartir el enlace (WhatsApp, redes...). Se genera
// con los datos de src/config/boda.ts; cambia aquí colores y composición.
export const runtime = "edge";
export const alt = nombresPareja;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const d = getWeddingDetails("es");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 96,
          background: "#ffffff",
          color: "#1b1e24",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", width: 96, height: 8, background: "#2052b6", marginBottom: 40 }} />
        <div style={{ display: "flex", fontSize: 110, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
          {nombresPareja}
        </div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 32, color: "#374151" }}>{d.dateLabel}</div>
        <div style={{ display: "flex", fontSize: 32, marginTop: 12, color: "#6b7280" }}>
          {d.venueName} · {d.venueLocation}
        </div>
      </div>
    ),
    { ...size }
  );
}
