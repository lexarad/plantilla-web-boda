export type RsvpStatus = "pendiente" | "confirmado" | "rechazado";
import { menuChoiceValues } from "@/lib/rsvp-options";

export type MenuChoice = (typeof menuChoiceValues)[number];
export type TaskStatus = "pendiente" | "en_progreso" | "hecha";
export type Priority = "baja" | "media" | "alta";
export type PaymentStatus = "pendiente" | "parcial" | "pagado";
export type BusStatus = "borrador" | "cotizado" | "confirmado";
export type SupplierStatus = "idea" | "contactado" | "cotizado" | "reservado" | "pagado";
export type AuditEntityType = "proveedor" | "documento" | "invitado";
export type AuditAction = "created" | "updated" | "deleted" | "moved";

export interface DashboardSummary {
  total_invitados: number;
  invitados_confirmados: number;
  invitados_pendientes: number;
  presupuesto_previsto: number;
  presupuesto_gastado: number;
  tareas_pendientes: number;
  mesas_asignadas: number;
  autobuses_asignados: number;
  proveedores_totales: number;
  documentos_totales: number;
}

/**
 * Todo lo que el panel necesita CONTAR, calculado por la base de datos
 * (función `metricas_dashboard`). Antes se descargaban las listas completas de
 * invitados, catering, mesas, autobuses y pasajeros solo para contarlas aquí.
 */
export interface DashboardMetrics extends DashboardSummary {
  invitados_rechazados: number;
  plazas_mesas: number;
  invitados_con_mesa: number;
  plazas_bus: number;
  pasajeros_bus: number;
  invitados_vieron_rsvp: number;
  invitados_respondieron_rsvp: number;
  catering_total: number;
  catering_con_alergias: number;
  menus: Record<string, number>;
}

export interface Guest {
  id: string;
  nombre: string;
  apellidos: string;
  email: string | null;
  telefono: string | null;
  grupo: string | null;
  confirmacion_asistencia: RsvpStatus;
  menu_elegido: MenuChoice;
  alergias_intolerancias: string | null;
  necesita_autobus: boolean;
  hotel_alojamiento: string | null;
  mesa_id: string | null;
  mesa_nombre?: string | null;
  notas_internas: string | null;
  comentarios: string | null;
  cancion_sugerida?: string | null;
  rsvp_token: string;
  codigo_invitacion: string;
  rsvp_first_view_at: string | null;
  rsvp_last_view_at: string | null;
  rsvp_view_count: number;
  rsvp_first_submitted_at: string | null;
  rsvp_last_submitted_at: string | null;
  rsvp_submit_count: number;
  rsvp_last_locale: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeddingTable {
  id: string;
  nombre: string;
  capacidad: number;
  notas: string | null;
}

export interface WeddingBus {
  id: string;
  nombre: string;
  proveedor: string | null;
  capacidad: number;
  paradas: string[];
  horarios: string | null;
  estado: BusStatus;
  notas: string | null;
}

export interface BusAssignment {
  autobus_id: string;
  invitado_id: string;
}

export interface Supplier {
  id: string;
  nombre: string;
  tipo: string;
  email: string | null;
  telefono: string | null;
  web: string | null;
  precio: number;
  estado: SupplierStatus;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeddingDocument {
  id: string;
  nombre: string;
  archivo_nombre: string;
  tipo: string;
  mime_type: string | null;
  tamano_bytes: number;
  storage_path: string;
  proveedor_id: string | null;
  proveedor_nombre?: string | null;
  notas: string | null;
  download_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditEvent {
  id: string;
  entity_type: AuditEntityType;
  entity_id: string;
  action: AuditAction;
  title: string;
  details: string | null;
  created_at: string;
}

export interface PlannerTask {
  id: string;
  titulo: string;
  descripcion: string | null;
  responsable: string;
  fecha_limite: string | null;
  estado: TaskStatus;
  prioridad: Priority;
  created_at: string;
  updated_at: string;
}

export interface BudgetItem {
  id: string;
  categoria: string;
  concepto: string;
  proveedor: string | null;
  coste_estimado: number;
  coste_real: number;
  estado_pago: PaymentStatus;
  fecha_pago: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  hora: string;
  titulo: string;
  descripcion: string | null;
  titulo_ca: string | null;
  descripcion_ca: string | null;
  fijo: boolean;
  created_at: string;
}

export interface MenuStat {
  menu: MenuChoice;
  label: string;
  count: number;
}

export interface CateringGuest {
  id: string;
  nombre: string;
  apellidos: string;
  grupo: string | null;
  menu_elegido: MenuChoice;
  alergias_intolerancias: string | null;
  mesa_nombre: string | null;
  necesita_autobus: boolean;
}

export interface RsvpGuest {
  nombre: string;
  apellidos: string;
  grupo: string | null;
  confirmacion_asistencia: RsvpStatus;
  menu_elegido: MenuChoice;
  alergias_intolerancias: string | null;
  necesita_autobus: boolean;
  hotel_alojamiento: string | null;
  comentarios: string | null;
  cancion_sugerida: string | null;
  /** Lo rellena la RPC de producción; el store demo no lo trae. */
  rsvp_last_submitted_at?: string | null;
}

export interface RsvpExtras {
  mesa_id: string | null;
  mesa_nombre: string | null;
  mesa_capacidad: number | null;
  mesa_notas: string | null;
  tablemates: Array<{
    nombre: string;
    apellidos: string;
    grupo: string | null;
    menu_elegido: MenuChoice;
    is_self?: boolean;
  }>;
  bus_nombre: string | null;
  bus_paradas: string[];
  bus_horarios: string | null;
  codigo_invitacion: string;
}
