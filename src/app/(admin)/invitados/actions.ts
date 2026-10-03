"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { deleteSchema, guestSchema, updateGuestSchema } from "@/lib/schemas";
import { getAdminSupabase, shouldUseDemoStore } from "@/lib/actions/guards";
import { buildAuditEventInput } from "@/lib/audit";
import { getGuestById, getTables } from "@/lib/data";
import { createDemoAuditEvent, createDemoGuest, createDemoGuests, deleteDemoGuest, updateDemoGuest } from "@/lib/demo-store";
import { parseCsvRecords } from "@/lib/csv";

function parseFormData(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function getFile(formData: FormData) {
  const file = formData.get("archivo");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona un archivo CSV.");
  }

  return file;
}

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function parseBooleanField(value: string) {
  return ["1", "true", "si", "yes", "y", "on"].includes(normalizeText(value));
}

function resolveTableId(value: string, tableLookup: Map<string, string>) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return null;
  }

  return tableLookup.get(normalizedValue) ?? null;
}

async function persistAuditEvent(
  entityType: "invitado",
  entityId: string,
  action: "created" | "updated" | "deleted" | "moved",
  title: string,
  details: string
) {
  const payload = buildAuditEventInput({
    entity_type: entityType,
    entity_id: entityId,
    action,
    title,
    details
  });

  if (await shouldUseDemoStore()) {
    await createDemoAuditEvent(payload);
    return;
  }

  const supabase = await getAdminSupabase();
  const { error } = await supabase.from("auditoria").insert(payload);

  if (error) {
    throw new Error(error.message);
  }
}

function describeGuestUpdate(previous: Awaited<ReturnType<typeof getGuestById>> | null, next: {
  nombre: string;
  apellidos: string;
  confirmacion_asistencia: string;
  menu_elegido: string;
  mesa_id: string | null;
  necesita_autobus: boolean;
}, nextMesaName: string | null) {
  const changes: string[] = [];

  if (previous && previous.confirmacion_asistencia !== next.confirmacion_asistencia) {
    changes.push(`RSVP: ${previous.confirmacion_asistencia} -> ${next.confirmacion_asistencia}`);
  }

  if (previous && previous.menu_elegido !== next.menu_elegido) {
    changes.push(`Menu: ${previous.menu_elegido} -> ${next.menu_elegido}`);
  }

  if (previous && previous.mesa_id !== next.mesa_id) {
    changes.push(`Mesa: ${previous.mesa_nombre ?? "Sin mesa"} -> ${nextMesaName ?? "Sin mesa"}`);
  }

  if (previous && previous.necesita_autobus !== next.necesita_autobus) {
    changes.push(`Autobús: ${previous.necesita_autobus ? "sí" : "no"} -> ${next.necesita_autobus ? "sí" : "no"}`);
  }

  return changes.length > 0 ? changes.join(" | ") : "Datos actualizados.";
}

export async function createGuestAction(formData: FormData) {
  const values = guestSchema.parse(parseFormData(formData));
  const id = randomUUID();
  const tables = await getTables();
  const mesaName = values.mesa_id ? tables.find((table) => table.id === values.mesa_id)?.nombre ?? null : null;

  if (await shouldUseDemoStore()) {
    await createDemoGuest({ ...values, id });
    await persistAuditEvent("invitado", id, "created", `${values.nombre} ${values.apellidos}`, `Invitado creado. Mesa: ${mesaName ?? "Sin mesa"}. Autobús: ${values.necesita_autobus ? "sí" : "no"}.`);
    revalidatePath("/dashboard");
    revalidatePath("/invitados");
    return;
  }

  const supabase = await getAdminSupabase();

  const { error } = await supabase.from("invitados").insert({ id, ...values });

  if (error) {
    throw new Error(error.message);
  }

  await persistAuditEvent("invitado", id, "created", `${values.nombre} ${values.apellidos}`, `Invitado creado. Mesa: ${mesaName ?? "Sin mesa"}. Autobús: ${values.necesita_autobus ? "sí" : "no"}.`);
  revalidatePath("/dashboard");
  revalidatePath("/invitados");
}

export async function updateGuestAction(formData: FormData) {
  const { id, ...values } = updateGuestSchema.parse(parseFormData(formData));
  const previousGuest = await getGuestById(id);
  const tables = await getTables();
  const mesaName = values.mesa_id ? tables.find((table) => table.id === values.mesa_id)?.nombre ?? null : null;

  if (await shouldUseDemoStore()) {
    await updateDemoGuest(id, values);
    await persistAuditEvent("invitado", id, "updated", `${values.nombre} ${values.apellidos}`, describeGuestUpdate(previousGuest, values, mesaName));
    revalidatePath("/dashboard");
    revalidatePath("/invitados");
    return;
  }

  const supabase = await getAdminSupabase();

  const { error } = await supabase.from("invitados").update(values).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await persistAuditEvent("invitado", id, "updated", `${values.nombre} ${values.apellidos}`, describeGuestUpdate(previousGuest, values, mesaName));
  revalidatePath("/dashboard");
  revalidatePath("/invitados");
}

export async function deleteGuestAction(formData: FormData) {
  const { id } = deleteSchema.parse(parseFormData(formData));
  const guest = await getGuestById(id);

  if (await shouldUseDemoStore()) {
    await deleteDemoGuest(id);
    await persistAuditEvent("invitado", id, "deleted", guest ? `${guest.nombre} ${guest.apellidos}` : "Invitado eliminado", "Invitado eliminado.");
    revalidatePath("/dashboard");
    revalidatePath("/invitados");
    return;
  }

  const supabase = await getAdminSupabase();

  // Borrado suave: el invitado sale de listados y recuentos, pero se puede
  // recuperar. El panel se usa desde el móvil y con prisa, y estos datos no
  // tienen copia de seguridad instantánea: un dedo gordo no debe ser definitivo.
  const { error } = await supabase
    .from("invitados")
    .update({ eliminado_en: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await persistAuditEvent("invitado", id, "deleted", guest ? `${guest.nombre} ${guest.apellidos}` : "Invitado eliminado", "Invitado movido a la papelera.");
  revalidatePath("/dashboard");
  revalidatePath("/invitados");
}

/** Devuelve a un invitado de la papelera a la lista. */
export async function restoreGuestAction(formData: FormData) {
  const { id } = deleteSchema.parse(parseFormData(formData));

  if (await shouldUseDemoStore()) {
    revalidatePath("/invitados");
    return;
  }

  const supabase = await getAdminSupabase();
  const { error } = await supabase.from("invitados").update({ eliminado_en: null }).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  const guest = await getGuestById(id);
  await persistAuditEvent(
    "invitado",
    id,
    "updated",
    guest ? `${guest.nombre} ${guest.apellidos}` : "Invitado",
    "Invitado recuperado de la papelera."
  );
  revalidatePath("/dashboard");
  revalidatePath("/invitados");
}

export async function importGuestsAction(formData: FormData) {
  const file = getFile(formData);
  const tables = await getTables();
  const tableLookup = new Map<string, string>([
    ...tables.map((table) => [normalizeText(table.nombre), table.id] as const),
    ...tables.map((table) => [table.id, table.id] as const)
  ]);
  const records = parseCsvRecords(await file.text());
  const parsedGuests: Array<ReturnType<typeof guestSchema.parse>> = [];
  const errors: string[] = [];

  for (const [index, record] of records.entries()) {
    const mesaRaw = record.mesa_id ?? record.mesa ?? record.mesa_nombre ?? "";
    const candidate = {
      nombre: record.nombre ?? "",
      apellidos: record.apellidos ?? "",
      email: record.email ?? "",
      telefono: record.telefono ?? "",
      grupo: record.grupo ?? "",
      confirmacion_asistencia: (record.confirmacion_asistencia ?? "pendiente").toLowerCase(),
      menu_elegido: (record.menu_elegido ?? "pendiente").toLowerCase(),
      alergias_intolerancias: record.alergias_intolerancias ?? "",
      necesita_autobus: parseBooleanField(record.necesita_autobus ?? record.bus ?? ""),
      hotel_alojamiento: record.hotel_alojamiento ?? "",
      mesa_id: resolveTableId(mesaRaw, tableLookup),
      notas_internas: record.notas_internas ?? ""
    };

    const parsed = guestSchema.safeParse(candidate);

    if (!parsed.success) {
      errors.push(`Fila ${index + 2}: ${parsed.error.issues[0]?.message ?? "Datos invalidos"}`);
      continue;
    }

    parsedGuests.push(parsed.data);
  }

  if (errors.length > 0) {
    throw new Error(`No se pudo importar el CSV.\n${errors.slice(0, 5).join("\n")}`);
  }

  if (parsedGuests.length === 0) {
    throw new Error("El CSV no contiene invitados validos.");
  }

  if (await shouldUseDemoStore()) {
    const createdIds = await createDemoGuests(parsedGuests);
    await Promise.all(
      createdIds.map((id, index) =>
        persistAuditEvent(
          "invitado",
          id,
          "created",
          `${parsedGuests[index]?.nombre ?? "Invitado"} ${parsedGuests[index]?.apellidos ?? ""}`.trim(),
          "Invitado importado desde CSV."
        )
      )
    );
    revalidatePath("/dashboard");
    revalidatePath("/invitados");
    revalidatePath("/mesas");
    revalidatePath("/autobuses");
    return;
  }

  const supabase = await getAdminSupabase();
  const importRows = parsedGuests.map((guest) => ({ id: randomUUID(), ...guest }));
  const { error } = await supabase.from("invitados").insert(importRows);

  if (error) {
    throw new Error(error.message);
  }

  await Promise.all(
    importRows.map((guest) =>
      persistAuditEvent(
        "invitado",
        guest.id,
        "created",
        `${guest.nombre} ${guest.apellidos}`.trim(),
        "Invitado importado desde CSV."
      )
    )
  );

  revalidatePath("/dashboard");
  revalidatePath("/invitados");
  revalidatePath("/mesas");
  revalidatePath("/autobuses");
}
