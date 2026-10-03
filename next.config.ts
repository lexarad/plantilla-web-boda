import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El servidor demo local (next dev en paralelo a npm run build) necesita su
  // propio directorio de salida: compartir .next corrompe los artefactos del dev
  // server cada vez que se lanza un build de producción en la misma copia.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }]
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    viewTransition: true
  },
  async headers() {
    // Content-Security-Policy: limita de dónde puede venir el código que se
    // ejecuta en la web. 'unsafe-inline' en los scripts es obligado mientras
    // Next.js inyecte sus scripts de hidratación sin nonce; aun así la política
    // corta lo importante: nadie puede cargar JavaScript de otro dominio, ni
    // meter la web en un iframe ajeno, ni mandar datos a un tercero.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      // Las fuentes las sirve Next desde el propio dominio (next/font).
      "font-src 'self' data:",
      // Supabase Storage sirve los documentos privados y las fotos.
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co",
      // El mapa de la página «Cómo llegar» va embebido de Google Maps.
      "frame-src 'self' https://www.google.com https://maps.google.com",
      // En desarrollo se permite previsualizar la web dentro de un iframe local.
      process.env.NODE_ENV === "production" ? "frame-ancestors 'none'" : "frame-ancestors 'self' http://localhost:*",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      // Solo en producción: en local no hay HTTPS y, al abrir la web desde el
      // móvil por la red de casa (http://192.168.x.x:3000), el navegador
      // intentaría cargar estilos e imágenes por https y fallarían.
      ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : [])
    ].join("; ");

    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // No hay uso legítimo de cámara/micrófono/geolocalización en la web.
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
      { key: "Content-Security-Policy", value: csp }
    ];
    // X-Frame-Options: DENY impediría la previsualización local en iframe, así
    // que solo se envía en producción.
    // HSTS solo tiene sentido bajo HTTPS (producción): fuerza el candado en visitas
    // posteriores y protege la sesión admin frente a downgrade/stripping.
    if (process.env.NODE_ENV === "production") {
      securityHeaders.push({ key: "X-Frame-Options", value: "DENY" });
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload"
      });
    }
    return [{ source: "/(.*)", headers: securityHeaders }];
  }
};

export default nextConfig;
