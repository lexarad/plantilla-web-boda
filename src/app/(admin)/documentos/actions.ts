"use server";

import { randomUUID } from "crypto";
import { Buffer } from "buffer";
import { revalidatePath } from "next/cache";
import { documentDeleteSchema, documentSchema, updateDocumentSchema } from "@/lib/schemas";
import { getAdminSupabase, shouldUseDemoStore } from "@/lib/actions/guards";
import { buildAuditEventInput } from "@/lib/audit";
import { isDemoMode } from "@/lib/env";
import { buildDocumentStoragePath, DOCUMENTS_BUCKET } from "@/lib/document-path";
import { getDocumentById } from "@/lib/data";
import { createDemoAuditEvent, createDemoDocument, deleteDemoDocument, updateDemoDocument } from "@/lib/demo-store";

function parseFormData(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function revalidateDocuments() {
  revalidatePath("/documentos");
}

async function logDocumentAudit(
  entityId: string,
  action: "created" | "updated" | "deleted",
  title: string,
  details: string
) {
  const payload = buildAuditEventInput({
    entity_type: "documento",
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

function getFile(formData: FormData) {
  const file = formData.get("archivo");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona un archivo para subir.");
  }

  return file;
}

export async function createDocumentAction(formData: FormData) {
  const values = documentSchema.parse(parseFormData(formData));
  const file = getFile(formData);

  if (await shouldUseDemoStore()) {
    const documentId = randomUUID();
    const bytes = Buffer.from(await file.arrayBuffer());
    const storagePath = buildDocumentStoragePath(documentId, file.name);

    await createDemoDocument({
      id: documentId,
      ...values,
      archivo_nombre: file.name,
      mime_type: file.type || "application/octet-stream",
      tamano_bytes: file.size,
      storage_path: storagePath,
        content_base64: bytes.toString("base64")
      });

    await logDocumentAudit(documentId, "created", values.nombre, `Documento creado. Archivo: ${file.name}.`);
    revalidateDocuments();
    return;
  }

  const supabase = await getAdminSupabase();
  const documentId = randomUUID();
  const storagePath = buildDocumentStoragePath(documentId, file.name);
  const fileBytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(storagePath, fileBytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { error: insertError } = await supabase.from("documentos").insert({
    id: documentId,
    nombre: values.nombre,
    archivo_nombre: file.name,
    tipo: values.tipo,
    mime_type: file.type || null,
    tamano_bytes: file.size,
    storage_path: storagePath,
    proveedor_id: values.proveedor_id,
    notas: values.notas
  });

  if (insertError) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
    throw new Error(insertError.message);
  }

  await logDocumentAudit(documentId, "created", values.nombre, `Documento creado. Archivo: ${file.name}.`);
  revalidateDocuments();
}

export async function updateDocumentAction(formData: FormData) {
  const { id, ...values } = updateDocumentSchema.parse(parseFormData(formData));

  if (await shouldUseDemoStore()) {
    await updateDemoDocument(id, values);
    await logDocumentAudit(id, "updated", values.nombre, `Documento actualizado. Tipo: ${values.tipo}.`);
    revalidateDocuments();
    return;
  }

  const supabase = await getAdminSupabase();
  const { error } = await supabase.from("documentos").update(values).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await logDocumentAudit(id, "updated", values.nombre, `Documento actualizado. Tipo: ${values.tipo}.`);
  revalidateDocuments();
}

export async function deleteDocumentAction(formData: FormData) {
  const { id } = documentDeleteSchema.parse(parseFormData(formData));
  const document = await getDocumentById(id);

  if (await shouldUseDemoStore()) {
    await deleteDemoDocument(id);
    await logDocumentAudit(id, "deleted", document?.nombre ?? "Documento eliminado", "Documento eliminado.");
    revalidateDocuments();
    return;
  }

  const supabase = await getAdminSupabase();
  const { data, error: fetchError } = await supabase.from("documentos").select("storage_path").eq("id", id).maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!data) {
    throw new Error("Documento no encontrado.");
  }

  const { error: removeError } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([data.storage_path]);

  if (removeError) {
    throw new Error(removeError.message);
  }

  const { error: deleteError } = await supabase.from("documentos").delete().eq("id", id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  await logDocumentAudit(id, "deleted", document?.nombre ?? "Documento eliminado", "Documento eliminado.");
  revalidateDocuments();
}
