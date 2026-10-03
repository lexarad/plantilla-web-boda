import { NextResponse } from "next/server";
import { filterGuests, normalizeSearchParam } from "@/lib/guest-filters";
import { buildGuestCsvRows } from "@/lib/guest-export";
import { stringifyCsv } from "@/lib/csv";
import { getGuests } from "@/lib/data";
import { isDemoAllowed, isDemoMode } from "@/lib/env";
import { requireAdminUser } from "@/lib/auth";

export async function GET(request: Request) {
  // Producción sin Supabase: el panel no existe, no servir el CSV a nadie.
  if (isDemoMode() && !isDemoAllowed()) {
    return new NextResponse("No autorizado", { status: 401 });
  }
  // Fuera del demo local (dev), exigir sesión de admin.
  if (!isDemoMode()) {
    await requireAdminUser();
  }

  const url = new URL(request.url);
  const params = {
    q: normalizeSearchParam(url.searchParams.get("q") ?? undefined),
    estado: normalizeSearchParam(url.searchParams.get("estado") ?? undefined),
    mesa: normalizeSearchParam(url.searchParams.get("mesa") ?? undefined)
  };

  const guests = await getGuests();
  const filteredGuests = filterGuests(guests, params);
  const csv = stringifyCsv(buildGuestCsvRows(filteredGuests));

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="invitados-filtrados.csv"'
    }
  });
}
