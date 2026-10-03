import { NextRequest, NextResponse } from "next/server";
import { rsvpTouchSchema } from "@/lib/schemas";
import { recordRsvpView } from "@/lib/rsvp-tracking";
import type { WeddingLocale } from "@/lib/wedding-details";

const VENTANA_MS = 60 * 60 * 1000;
// Memoria del proceso: se pierde en cada arranque en frío, y no pasa nada.
// El objetivo no es un recuento exacto sino evitar que recargar dispare el
// contador; una solución con base de datos costaría una escritura por visita.
const ultimaVista = new Map<string, number>();

function yaContadoRecientemente(token: string) {
  const ahora = Date.now();
  const previa = ultimaVista.get(token);

  if (previa && ahora - previa < VENTANA_MS) {
    return true;
  }

  // Limpieza barata para que el mapa no crezca sin límite en un proceso longevo.
  if (ultimaVista.size > 500) {
    for (const [clave, momento] of ultimaVista) {
      if (ahora - momento > VENTANA_MS) ultimaVista.delete(clave);
    }
  }

  ultimaVista.set(token, ahora);
  return false;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = rsvpTouchSchema.safeParse({ token, lang: body?.lang });

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  // Una apertura por invitado y hora. Sin esto, recargar la página inflaba el
  // contador que usáis para decidir a quién recordarle el RSVP («este ni lo ha
  // abierto»), y una pestaña reabierta valía lo mismo que un invitado nuevo.
  if (yaContadoRecientemente(parsed.data.token)) {
    return NextResponse.json({ ok: true, contado: false });
  }

  // Respuesta uniforme (200) exista o no el token: evita que el endpoint sea un
  // oráculo de enumeración. El tracking es best-effort; cualquier fallo se traga.
  try {
    await recordRsvpView(parsed.data.token, (parsed.data.lang ?? "es") as WeddingLocale);
  } catch {
    // no-op: no revelar si el token existe ni romper la navegación del invitado
  }

  return NextResponse.json({ ok: true });
}
