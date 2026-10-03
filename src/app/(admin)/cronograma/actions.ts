"use server";

import { revalidatePath } from "next/cache";
import { timelineEventSchema, updateTimelineEventSchema, deleteSchema } from "@/lib/schemas";
import { getAdminSupabase, shouldUseDemoStore } from "@/lib/actions/guards";
import {
  createDemoTimelineEvent,
  deleteDemoTimelineEvent,
  updateDemoTimelineEvent
} from "@/lib/demo-store";

function parseFormData(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createTimelineEventAction(formData: FormData) {
  const values = timelineEventSchema.parse(parseFormData(formData));

  if (await shouldUseDemoStore()) {
    await createDemoTimelineEvent(values);
    revalidatePath("/cronograma");
    return;
  }

  const supabase = await getAdminSupabase();
  const { error } = await supabase.from("cronograma").insert({ ...values, fijo: false });
  if (error) throw new Error(error.message);
  revalidatePath("/cronograma");
}

export async function updateTimelineEventAction(formData: FormData) {
  const { id, ...values } = updateTimelineEventSchema.parse(parseFormData(formData));

  if (await shouldUseDemoStore()) {
    await updateDemoTimelineEvent(id, values);
    revalidatePath("/cronograma");
    return;
  }

  const supabase = await getAdminSupabase();
  const { error } = await supabase.from("cronograma").update(values).eq("id", id).eq("fijo", false);
  if (error) throw new Error(error.message);
  revalidatePath("/cronograma");
}

export async function deleteTimelineEventAction(formData: FormData) {
  const { id } = deleteSchema.parse(parseFormData(formData));

  if (await shouldUseDemoStore()) {
    await deleteDemoTimelineEvent(id);
    revalidatePath("/cronograma");
    return;
  }

  const supabase = await getAdminSupabase();
  const { error } = await supabase.from("cronograma").delete().eq("id", id).eq("fijo", false);
  if (error) throw new Error(error.message);
  revalidatePath("/cronograma");
}
