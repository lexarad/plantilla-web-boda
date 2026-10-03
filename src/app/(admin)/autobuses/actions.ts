"use server";

import { revalidatePath } from "next/cache";
import { assignGuestBusSchema, busDeleteSchema, busSchema, updateBusSchema } from "@/lib/schemas";
import { getAdminSupabase, shouldUseDemoStore } from "@/lib/actions/guards";
import { buildAuditEventInput } from "@/lib/audit";
import { getBusAssignments, getBuses, getGuestById } from "@/lib/data";
import { isDemoMode } from "@/lib/env";
import { createDemoAuditEvent } from "@/lib/demo-store";
import { createDemoBus, deleteDemoBus, moveDemoGuestToBus, updateDemoBus } from "@/lib/demo-store";

function parseFormData(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function revalidateBuses() {
  revalidatePath("/autobuses");
  revalidatePath("/dashboard");
  revalidatePath("/invitados");
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

export async function createBusAction(formData: FormData) {
  const values = busSchema.parse(parseFormData(formData));

  if (await shouldUseDemoStore()) {
    await createDemoBus(values);
    revalidateBuses();
    return;
  }

  const supabase = await getAdminSupabase();
  const { error } = await supabase.from("autobuses").insert(values);

  if (error) {
    throw new Error(error.message);
  }

  revalidateBuses();
}

export async function updateBusAction(formData: FormData) {
  const { id, ...values } = updateBusSchema.parse(parseFormData(formData));

  if (await shouldUseDemoStore()) {
    await updateDemoBus(id, values);
    revalidateBuses();
    return;
  }

  const supabase = await getAdminSupabase();
  const { error } = await supabase.from("autobuses").update(values).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateBuses();
}

export async function deleteBusAction(formData: FormData) {
  const { id } = busDeleteSchema.parse(parseFormData(formData));

  if (await shouldUseDemoStore()) {
    await deleteDemoBus(id);
    revalidateBuses();
    return;
  }

  const supabase = await getAdminSupabase();
  const { error } = await supabase.from("autobuses").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateBuses();
}

export async function moveGuestToBusAction(formData: FormData) {
  const { guest_id, autobus_id } = assignGuestBusSchema.parse(parseFormData(formData));
  const [guest, busAssignments, buses] = await Promise.all([getGuestById(guest_id), getBusAssignments(), getBuses()]);
  const previousBusId = busAssignments.find((assignment) => assignment.invitado_id === guest_id)?.autobus_id ?? null;
  const previousBusName = previousBusId ? buses.find((bus) => bus.id === previousBusId)?.nombre ?? null : null;
  const targetBusName = autobus_id ? buses.find((bus) => bus.id === autobus_id)?.nombre ?? null : null;
  const guestName = guest ? `${guest.nombre} ${guest.apellidos}`.trim() : "Invitado";

  if (await shouldUseDemoStore()) {
    await moveDemoGuestToBus(guest_id, autobus_id);
    await persistGuestMoveAudit(
      guest_id,
      guestName,
      `Autobús: ${previousBusName ?? "Sin autobús"} -> ${targetBusName ?? "Sin autobús"}`
    );
    revalidateBuses();
    return;
  }

  const supabase = await getAdminSupabase();
  const { error: removeError } = await supabase.from("autobus_invitados").delete().eq("invitado_id", guest_id);

  if (removeError) {
    throw new Error(removeError.message);
  }

  if (autobus_id) {
    const { error: insertError } = await supabase.from("autobus_invitados").insert({
      autobus_id,
      invitado_id: guest_id
    });

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  await persistGuestMoveAudit(
    guest_id,
    guestName,
    `Autobús: ${previousBusName ?? "Sin autobús"} -> ${targetBusName ?? "Sin autobús"}`
  );
  revalidateBuses();
}
