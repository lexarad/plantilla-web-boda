import type { AuditAction, AuditEntityType } from "@/lib/types";

export interface AuditEventInput {
  entity_type: AuditEntityType;
  entity_id: string;
  action: AuditAction;
  title: string;
  details?: string | null;
  created_at?: string;
}

export function buildAuditEventInput(values: AuditEventInput) {
  return {
    ...values,
    details: values.details ?? null,
    created_at: values.created_at ?? new Date().toISOString()
  };
}
