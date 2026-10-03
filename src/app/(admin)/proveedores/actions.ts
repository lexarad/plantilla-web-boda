"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { supplierDeleteSchema, supplierSchema, updateSupplierSchema } from "@/lib/schemas";
import { getAdminSupabase, shouldUseDemoStore } from "@/lib/actions/guards";
import { buildAuditEventInput } from "@/lib/audit";
import { isDemoMode } from "@/lib/env";
import { getSupplierById } from "@/lib/data";
import { createDemoAuditEvent, createDemoSupplier, deleteDemoSupplier, updateDemoSupplier } from "@/lib/demo-store";

function parseFormData(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function revalidateSuppliers() {
  revalidatePath("/proveedores");
}

async function logSupplierAudit(
  entityId: string,
  action: "created" | "updated" | "deleted",
  title: string,
  details: string
) {
  const payload = buildAuditEventInput({
    entity_type: "proveedor",
    entity_id: entityId,
    action,
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

export async function createSupplierAction(formData: FormData) {
  const values = supplierSchema.parse(parseFormData(formData));
  const id = randomUUID();

  if (await shouldUseDemoStore()) {
    await createDemoSupplier({ ...values, id });
    await logSupplierAudit(id, "created", values.nombre, `Proveedor creado. Tipo: ${values.tipo}.`);
    revalidateSuppliers();
    return;
  }

  const supabase = await getAdminSupabase();
  // .select() nos devuelve las filas afectadas: si vienen 0, el insert no cuajó
  // (RLS, constraint) y no debemos reportar «guardado» en silencio.
  const { data, error } = await supabase.from("proveedores").insert({ id, ...values }).select();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No se pudo crear el proveedor: la base de datos no devolvió ninguna fila.");
  }

  await logSupplierAudit(id, "created", values.nombre, `Proveedor creado. Tipo: ${values.tipo}.`);
  revalidateSuppliers();
}

export async function updateSupplierAction(formData: FormData) {
  const { id, ...values } = updateSupplierSchema.parse(parseFormData(formData));

  if (await shouldUseDemoStore()) {
    await updateDemoSupplier(id, values);
    await logSupplierAudit(id, "updated", values.nombre, `Proveedor actualizado. Estado: ${values.estado}.`);
    revalidateSuppliers();
    return;
  }

  const supabase = await getAdminSupabase();
  // .select() confirma que la fila existía y se actualizó: 0 filas = proveedor
  // inexistente, y hay que avisar en vez de simular un guardado correcto.
  const { data, error } = await supabase.from("proveedores").update(values).eq("id", id).select();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No se pudo actualizar el proveedor: no existe o no se modificó ninguna fila.");
  }

  await logSupplierAudit(id, "updated", values.nombre, `Proveedor actualizado. Estado: ${values.estado}.`);
  revalidateSuppliers();
}

export async function deleteSupplierAction(formData: FormData) {
  const { id } = supplierDeleteSchema.parse(parseFormData(formData));
  const supplier = await getSupplierById(id);

  if (await shouldUseDemoStore()) {
    await deleteDemoSupplier(id);
    await logSupplierAudit(id, "deleted", supplier?.nombre ?? "Proveedor eliminado", "Proveedor eliminado.");
    revalidateSuppliers();
    return;
  }

  const supabase = await getAdminSupabase();
  const { error } = await supabase.from("proveedores").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await logSupplierAudit(id, "deleted", supplier?.nombre ?? "Proveedor eliminado", "Proveedor eliminado.");
  revalidateSuppliers();
}
