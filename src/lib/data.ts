import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getDemoBusAssignments,
  getDemoBuses,
  getDemoBusById,
  getDemoBudgetItems,
  getDemoCateringGuests,
  getDemoDashboardData,
  getDemoDocuments,
  getDemoDocumentById,
  getDemoAuditEvents,
  getDemoGuestById,
  getDemoGuests,
  getDemoRsvpExtras,
  getDemoRsvpGuest,
  getDemoSettings,
  getDemoSupplierById,
  getDemoSuppliers,
  getDemoTables,
  getDemoTableById,
  getDemoTasks,
  getDemoTimelineEvents
} from "@/lib/demo-store";
import type {
  BusAssignment,
  BudgetItem,
  CateringGuest,
  DashboardMetrics,
  DashboardSummary,
  AuditEvent,
  Guest,
  PlannerTask,
  TimelineEvent,
  WeddingDocument,
  Supplier,
  WeddingBus,
  WeddingTable
} from "@/lib/types";
import { DOCUMENTS_BUCKET } from "@/lib/document-path";

// Las lecturas degradan a lista vacía si fallan (la página no rompe), pero sin
// log el fallo era invisible en producción: un error de RLS o de red se veía
// exactamente igual que "no hay datos".
function logQueryError(context: string, error: { message?: string } | null | undefined) {
  if (error) {
    console.error(`[data] ${context}: ${error.message ?? JSON.stringify(error)}`);
  }
}

const emptySummary: DashboardSummary = {
  total_invitados: 0,
  invitados_confirmados: 0,
  invitados_pendientes: 0,
  presupuesto_previsto: 0,
  presupuesto_gastado: 0,
  tareas_pendientes: 0,
  mesas_asignadas: 0,
  autobuses_asignados: 0,
  proveedores_totales: 0,
  documentos_totales: 0
};

type GuestRow = Guest & {
  mesas: { nombre: string } | null;
};

type SupplierRow = Supplier;
type DocumentRow = WeddingDocument & {
  proveedores: { nombre: string } | null;
};
type AuditEventRow = AuditEvent;

export async function getDashboardData() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoDashboardData();
  }

  const { data: summaryData, error: summaryError } = await supabase.rpc("resumen_dashboard");
  logQueryError("resumen_dashboard", summaryError);
  const { data: upcomingTasks, error: tasksError } = await supabase
    .from("tareas")
    .select("*")
    .neq("estado", "hecha")
    .order("fecha_limite", { ascending: true, nullsFirst: false })
    .limit(5)
    .returns<PlannerTask[]>();
  logQueryError("getDashboardData tareas", tasksError);

  return {
    summary: Array.isArray(summaryData) && summaryData.length > 0 ? summaryData[0] : emptySummary,
    upcomingTasks: upcomingTasks ?? [],
    setupPending: false
  };
}

/**
 * Métricas del panel en UNA consulta. En modo demo se derivan del store en
 * memoria para que la pantalla se comporte igual que con datos reales.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const [{ summary }, guests, catering, tables, buses, busAssignments] = await Promise.all([
      getDemoDashboardData(),
      getDemoGuests(),
      getDemoCateringGuests(),
      getDemoTables(),
      getDemoBuses(),
      getDemoBusAssignments()
    ]);

    const menus: Record<string, number> = {};
    for (const guest of catering) {
      menus[guest.menu_elegido] = (menus[guest.menu_elegido] ?? 0) + 1;
    }

    return {
      ...summary,
      invitados_rechazados: guests.filter((g) => g.confirmacion_asistencia === "rechazado").length,
      plazas_mesas: tables.reduce((sum, table) => sum + table.capacidad, 0),
      invitados_con_mesa: guests.filter((g) => g.mesa_id).length,
      plazas_bus: buses.reduce((sum, bus) => sum + bus.capacidad, 0),
      pasajeros_bus: busAssignments.length,
      invitados_vieron_rsvp: guests.filter((g) => g.rsvp_view_count > 0).length,
      invitados_respondieron_rsvp: guests.filter((g) => g.rsvp_submit_count > 0).length,
      catering_total: catering.length,
      catering_con_alergias: catering.filter((g) => g.alergias_intolerancias).length,
      menus
    };
  }

  const { data, error } = await supabase.rpc("metricas_dashboard");
  logQueryError("metricas_dashboard", error);

  const row = Array.isArray(data) && data.length > 0 ? (data[0] as DashboardMetrics) : null;

  return (
    row ?? {
      ...emptySummary,
      invitados_rechazados: 0,
      plazas_mesas: 0,
      invitados_con_mesa: 0,
      plazas_bus: 0,
      pasajeros_bus: 0,
      invitados_vieron_rsvp: 0,
      invitados_respondieron_rsvp: 0,
      catering_total: 0,
      catering_con_alergias: 0,
      menus: {}
    }
  );
}

export async function getGuests() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoGuests();
  }

  const { data, error } = await supabase
    .from("invitados")
    .select("*, mesas(nombre)")
    // Los de la papelera no aparecen en los listados (getDeletedGuests los saca).
    .is("eliminado_en", null)
    .order("grupo", { ascending: true, nullsFirst: false })
    .order("apellidos", { ascending: true })
    .returns<GuestRow[]>();
  logQueryError("getGuests", error);

  return (data ?? []).map(({ mesas, ...guest }) => ({
    ...guest,
    mesa_nombre: mesas?.nombre ?? null
  }));
}

/** Invitados en la papelera, para poder recuperarlos. */
export async function getDeletedGuests() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("invitados")
    .select("id, nombre, apellidos, grupo, eliminado_en")
    .not("eliminado_en", "is", null)
    .order("eliminado_en", { ascending: false })
    .returns<Array<{ id: string; nombre: string; apellidos: string; grupo: string | null; eliminado_en: string }>>();
  logQueryError("getDeletedGuests", error);

  return data ?? [];
}

/**
 * A quién conviene recordarle el RSVP: primero los que ni han abierto su
 * enlace, luego los que lo abrieron y no contestaron. Consulta acotada (no
 * trae la lista entera) porque esto se pinta en el panel de inicio.
 */
export async function getGuestsToRemind(limit = 8) {
  type Fila = {
    id: string;
    nombre: string;
    apellidos: string;
    codigo_invitacion: string;
    telefono: string | null;
    rsvp_view_count: number;
    rsvp_last_view_at: string | null;
  };

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const demo = await getDemoGuests();
    return demo
      .filter((guest) => guest.confirmacion_asistencia === "pendiente")
      .sort((a, b) => a.rsvp_view_count - b.rsvp_view_count)
      .slice(0, limit) as unknown as Fila[];
  }

  const { data, error } = await supabase
    .from("invitados")
    .select("id, nombre, apellidos, codigo_invitacion, telefono, rsvp_view_count, rsvp_last_view_at")
    .is("eliminado_en", null)
    .eq("confirmacion_asistencia", "pendiente")
    .order("rsvp_view_count", { ascending: true })
    .order("apellidos", { ascending: true })
    .limit(limit)
    .returns<Fila[]>();
  logQueryError("getGuestsToRemind", error);

  return data ?? [];
}

export async function getGuestById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoGuestById(id);
  }

  const { data, error } = await supabase.from("invitados").select("*, mesas(nombre)").eq("id", id).maybeSingle<GuestRow>();
  logQueryError("getGuestById", error);

  if (!data) {
    return null;
  }

  const { mesas, ...guest } = data;

  return {
    ...guest,
    mesa_nombre: mesas?.nombre ?? null
  };
}

export async function getTables() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoTables();
  }

  const { data, error } = await supabase.from("mesas").select("*").order("nombre").returns<WeddingTable[]>();
  logQueryError("getTables", error);
  return data ?? [];
}

export async function getTableById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoTableById(id);
  }

  const { data, error } = await supabase.from("mesas").select("*").eq("id", id).maybeSingle<WeddingTable>();
  logQueryError("getTableById", error);
  return data ?? null;
}

export async function getBuses() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoBuses();
  }

  const { data, error } = await supabase.from("autobuses").select("*").order("nombre").returns<WeddingBus[]>();
  logQueryError("getBuses", error);
  return data ?? [];
}

export async function getBusById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoBusById(id);
  }

  const { data, error } = await supabase.from("autobuses").select("*").eq("id", id).maybeSingle<WeddingBus>();
  logQueryError("getBusById", error);
  return data ?? null;
}

export async function getBusAssignments() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoBusAssignments();
  }

  const { data, error } = await supabase.from("autobus_invitados").select("autobus_id, invitado_id").returns<BusAssignment[]>();
  logQueryError("getBusAssignments", error);
  return data ?? [];
}

export async function getSuppliers() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoSuppliers();
  }

  const { data, error } = await supabase.from("proveedores").select("*").order("tipo", { ascending: true }).order("nombre").returns<Supplier[]>();
  logQueryError("getSuppliers", error);
  return data ?? [];
}

export async function getSupplierById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoSupplierById(id);
  }

  const { data, error } = await supabase.from("proveedores").select("*").eq("id", id).maybeSingle<Supplier>();
  logQueryError("getSupplierById", error);
  return data ?? null;
}

export async function getDocuments() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoDocuments();
  }

  const { data, error } = await supabase
    .from("documentos")
    .select("*, proveedores(nombre)")
    .order("created_at", { ascending: false })
    .returns<DocumentRow[]>();
  logQueryError("getDocuments", error);

  const documents = data ?? [];

  // Firmar todas las URLs en UNA sola llamada (batch) en vez de N round-trips a
  // storage (uno por documento).
  const paths = documents.map((d) => d.storage_path);
  const { data: signedList, error: signError } = paths.length
    ? await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrls(paths, 60 * 30)
    : { data: [], error: null };
  logQueryError("getDocuments createSignedUrls", signError);
  const signedByPath = new Map((signedList ?? []).map((s) => [s.path, s.signedUrl]));

  return documents.map(({ proveedores, ...document }) => ({
    ...document,
    proveedor_nombre: proveedores?.nombre ?? null,
    download_url: signedByPath.get(document.storage_path) ?? null
  }));
}

export async function getDocumentById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoDocumentById(id);
  }

  const { data, error } = await supabase
    .from("documentos")
    .select("*, proveedores(nombre)")
    .eq("id", id)
    .maybeSingle<DocumentRow>();
  logQueryError("getDocumentById", error);

  if (!data) {
    return null;
  }

  const { proveedores, ...document } = data;
  const { data: signedUrlData, error: signError } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(document.storage_path, 60 * 30);
  logQueryError("getDocumentById createSignedUrl", signError);

  return {
    ...document,
    proveedor_nombre: proveedores?.nombre ?? null,
    download_url: signedUrlData?.signedUrl ?? null
  };
}

export async function getAuditEvents(entityType: AuditEvent["entity_type"], entityId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoAuditEvents(entityType, entityId);
  }

  const { data, error } = await supabase
    .from("auditoria")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .returns<AuditEventRow[]>();
  logQueryError("getAuditEvents", error);

  return data ?? [];
}

export async function getTasks() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoTasks();
  }

  const { data, error } = await supabase
    .from("tareas")
    .select("*")
    .order("fecha_limite", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<PlannerTask[]>();
  logQueryError("getTasks", error);

  return data ?? [];
}

export async function getBudgetItems() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoBudgetItems();
  }

  const { data, error } = await supabase
    .from("gastos")
    .select("*")
    .order("categoria", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<BudgetItem[]>();
  logQueryError("getBudgetItems", error);

  return data ?? [];
}

export async function getTimelineEvents(): Promise<TimelineEvent[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoTimelineEvents();
  }

  const { data, error } = await supabase
    .from("cronograma")
    .select("*")
    .order("hora", { ascending: true })
    .returns<TimelineEvent[]>();
  logQueryError("getTimelineEvents", error);

  return data ?? [];
}

export async function getCateringGuests(): Promise<CateringGuest[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoCateringGuests();
  }

  type CateringRow = CateringGuest & { mesas: { nombre: string } | null };

  const { data, error } = await supabase
    .from("invitados")
    .select("id, nombre, apellidos, grupo, menu_elegido, alergias_intolerancias, necesita_autobus, mesa_id, mesas(nombre)")
    .is("eliminado_en", null)
    .eq("confirmacion_asistencia", "confirmado")
    .order("menu_elegido", { ascending: true })
    .order("apellidos", { ascending: true })
    .returns<CateringRow[]>();
  logQueryError("getCateringGuests", error);

  return (data ?? []).map(({ mesas, ...guest }) => ({
    ...guest,
    mesa_nombre: mesas?.nombre ?? null
  }));
}

export type MenuPopularity = {
  menu: string;
  count: number;
  percent: number;
};

export async function getMenuPopularity(): Promise<MenuPopularity[]> {
  const supabase = await createSupabaseServerClient();
  let list: { menu_elegido: string; confirmacion_asistencia: string }[] = [];

  if (!supabase) {
    const all = await getDemoGuests();
    list = all.map((g) => ({ menu_elegido: g.menu_elegido, confirmacion_asistencia: g.confirmacion_asistencia }));
  } else {
    // RPC security-definer: un SELECT directo como anon lo bloquearía la RLS
    // (solo admin), dejando la popularidad vacía en producción.
    const { data, error } = await supabase.rpc("popularidad_menus");
    logQueryError("popularidad_menus", error);
    list = (data ?? []) as { menu_elegido: string; confirmacion_asistencia: string }[];
  }

  const confirmed = list.filter((g) => g.confirmacion_asistencia === "confirmado");
  const totals = new Map<string, number>();
  for (const g of confirmed) {
    if (g.menu_elegido === "pendiente") continue;
    totals.set(g.menu_elegido, (totals.get(g.menu_elegido) ?? 0) + 1);
  }
  const totalConfirmed = Math.max(confirmed.length, 1);
  return Array.from(totals.entries())
    .map(([menu, count]) => ({ menu, count, percent: Math.round((count / totalConfirmed) * 100) }))
    .sort((a, b) => b.count - a.count);
}

export type WeddingSettings = {
  iban: string;
  ibanHolder: string;
  ibanConcept: string;
  contactPhone: string;
  contactEmail: string;
  hotelSuggestions: string;
};

const DEFAULT_SETTINGS: WeddingSettings = {
  iban: process.env.NEXT_PUBLIC_WEDDING_IBAN ?? "",
  ibanHolder: process.env.NEXT_PUBLIC_WEDDING_IBAN_HOLDER ?? "",
  ibanConcept: process.env.NEXT_PUBLIC_WEDDING_IBAN_CONCEPT ?? "",
  contactPhone: process.env.NEXT_PUBLIC_WEDDING_PHONE ?? "",
  contactEmail: process.env.NEXT_PUBLIC_WEDDING_EMAIL ?? "",
  hotelSuggestions: process.env.NEXT_PUBLIC_WEDDING_HOTELS ?? ""
};

export async function getWeddingSettings(): Promise<WeddingSettings> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const stored = await getDemoSettings();
    // Demo store may have empty/placeholder values; prefer non-empty stored, fallback to defaults.
    return {
      iban: stored.iban || DEFAULT_SETTINGS.iban,
      ibanHolder: stored.ibanHolder || DEFAULT_SETTINGS.ibanHolder,
      ibanConcept: stored.ibanConcept || DEFAULT_SETTINGS.ibanConcept,
      contactPhone: stored.contactPhone || DEFAULT_SETTINGS.contactPhone,
      contactEmail: stored.contactEmail || DEFAULT_SETTINGS.contactEmail,
      hotelSuggestions: stored.hotelSuggestions || DEFAULT_SETTINGS.hotelSuggestions
    };
  }
  // Supabase mode: env vars only (no settings table to keep this PR scoped).
  return DEFAULT_SETTINGS;
}

export async function getRsvpGuest(token: string) {
  const { guest } = await getRsvpGuestResult(token);
  return guest;
}

/**
 * Igual que getRsvpGuest pero distinguiendo «este enlace no existe» de «la base
 * de datos no responde». Sin esta diferencia, una caída de Supabase le decía al
 * invitado que su invitación no era válida: el peor mensaje posible, porque le
 * hace pensar que no está invitado y no vuelve a intentarlo.
 */
export async function getRsvpGuestResult(token: string): Promise<{
  guest: Awaited<ReturnType<typeof getDemoRsvpGuest>>;
  unavailable: boolean;
}> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { guest: await getDemoRsvpGuest(token), unavailable: false };
  }

  const { data, error } = await supabase.rpc("obtener_rsvp_invitado", { token_param: token });
  logQueryError("obtener_rsvp_invitado", error);

  if (error) {
    return { guest: null, unavailable: true };
  }

  return {
    guest: Array.isArray(data) && data.length > 0 ? data[0] : null,
    unavailable: false
  };
}

export async function getRsvpExtras(token: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getDemoRsvpExtras(token);
  }

  // RPC security-definer `obtener_rsvp_extras`: resuelve por rsvp_token O código
  // de invitación (el segmento de la URL pública es el código, no el token) y
  // devuelve mesa + compañeros + autobús. Antes se hacían SELECT directos que la
  // RLS bloqueaba como anon Y filtrando por rsvp_token con el código → doble
  // fallo que dejaba "Mi reserva" vacío en producción.
  type ExtrasPayload = NonNullable<Awaited<ReturnType<typeof getDemoRsvpExtras>>>;
  const { data, error } = await supabase.rpc("obtener_rsvp_extras", { token_param: token });
  logQueryError("obtener_rsvp_extras", error);

  if (!data) return null;

  return data as ExtrasPayload;
}
