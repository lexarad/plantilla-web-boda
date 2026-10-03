import { NextResponse } from "next/server";
import { getCateringGuests } from "@/lib/data";
import { stringifyCsv } from "@/lib/csv";
import { menuChoiceOptions } from "@/lib/rsvp-options";
import { isDemoAllowed, isDemoMode } from "@/lib/env";
import { requireAdminUser } from "@/lib/auth";

export async function GET() {
  // Producción sin Supabase: el panel no existe, no servir el CSV a nadie.
  if (isDemoMode() && !isDemoAllowed()) {
    return new NextResponse("No autorizado", { status: 401 });
  }
  // Fuera del demo local (dev), exigir sesión de admin.
  if (!isDemoMode()) {
    await requireAdminUser();
  }

  const guests = await getCateringGuests();

  const rows = guests.map((guest) => ({
    nombre: guest.nombre,
    apellidos: guest.apellidos,
    grupo: guest.grupo ?? "",
    menu: menuChoiceOptions.find((o) => o.value === guest.menu_elegido)?.label ?? guest.menu_elegido,
    alergias: guest.alergias_intolerancias ?? "",
    mesa: guest.mesa_nombre ?? "",
    necesita_autobus: guest.necesita_autobus ? "si" : "no"
  }));

  const csv = stringifyCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="catering-confirmados.csv"'
    }
  });
}
