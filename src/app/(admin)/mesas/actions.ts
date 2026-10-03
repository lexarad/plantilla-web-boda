"use server";

import { revalidatePath } from "next/cache";
import {
  assignGuestTableSchema,
  tableDeleteSchema,
  tableSchema,
  updateTableSchema
} from "@/lib/schemas";
import { getAdminSupabase, shouldUseDemoStore } from "@/lib/actions/guards";
import { buildAuditEventInput } from "@/lib/audit";
import { getGuestById, getTables } from "@/lib/data";
import { isDemoMode } from "@/lib/env";
import { createDemoAuditEvent } from "@/lib/demo-store";
import {
  createDemoTable,
  deleteDemoTable,
  moveDemoGuestToTable,
  updateDemoTable
} from "@/lib/demo-store";

function parseFormData(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function revalidateTables() {
  revalidatePath("/mesas");
  revalidatePath("/invitados");
  revalidatePath("/dashboard");
}

async function persistGuestMoveAudit(guestId: string, title: string, details: string) {
  const payload = buildAuditEventInput({
    entity_type: "invitado",
    entity_id: guestId,
    action: "moved",
    title,
    details
  });

  if (isDemoMode()) {
    await createDemoAuditEvent(payload);
    return;
  }

  const supabase = await getAdminSupabase();
  const { error } = await supabase.from("auditoria").insert(payload);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createTableAction(formData: FormData) {
  const values = tableSchema.parse(parseFormData(formData));

  if (await shouldUseDemoStore()) {
    await createDemoTable(values);
    revalidateTables();
    return;
  }

  const supabase = await getAdminSupabase();
  const { error } = await supabase.from("mesas").insert(values);

  if (error) {
    throw new Error(error.message);
  }

  revalidateTables();
}

export async function updateTableAction(formData: FormData) {
  const { id, ...values } = updateTableSchema.parse(parseFormData(formData));

  if (await shouldUseDemoStore()) {
    await updateDemoTable(id, values);
    revalidateTables();
    return;
  }

  const supabase = await getAdminSupabase();
  const { error } = await supabase.from("mesas").update(values).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateTables();
}

export async function deleteTableAction(formData: FormData) {
  const { id } = tableDeleteSchema.parse(parseFormData(formData));

  if (await shouldUseDemoStore()) {
    await deleteDemoTable(id);
    revalidateTables();
    return;
  }

  const supabase = await getAdminSupabase();
  const { error } = await supabase.from("mesas").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateTables();
}

export async function moveGuestToTableAction(formData: FormData) {
  const { guest_id, mesa_id } = assignGuestTableSchema.parse(parseFormData(formData));
  const [guest, tables] = await Promise.all([getGuestById(guest_id), getTables()]);
  const targetTableName = mesa_id ? tables.find((table) => table.id === mesa_id)?.nombre ?? null : null;
  const previousTableName = guest?.mesa_nombre ?? null;
  const guestName = guest ? `${guest.nombre} ${guest.apellidos}`.trim() : "Invitado";

  if (await shouldUseDemoStore()) {
    await moveDemoGuestToTable(guest_id, mesa_id);
    await persistGuestMoveAudit(
      guest_id,
      guestName,
      `Mesa: ${previousTableName ?? "Sin mesa"} -> ${targetTableName ?? "Sin mesa"}`
    );
    revalidateTables();
    return;
  }

  const supabase = await getAdminSupabase();
  const { error } = await supabase.from("invitados").update({ mesa_id }).eq("id", guest_id);

  if (error) {
    throw new Error(error.message);
  }

  await persistGuestMoveAudit(
    guest_id,
    guestName,
    `Mesa: ${previousTableName ?? "Sin mesa"} -> ${targetTableName ?? "Sin mesa"}`
  );
  revalidateTables();
}
