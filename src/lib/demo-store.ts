import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { readFile, writeFile } from "fs/promises";
import { buildAuditEventInput } from "@/lib/audit";
import { generateInvitationCode, normalizeInvitationCode } from "@/lib/invitation-code";
import type {
  AuditEvent,
  BusAssignment,
  BudgetItem,
  CateringGuest,
  DashboardSummary,
  Guest,
  PlannerTask,
  RsvpGuest,
  TimelineEvent,
  WeddingDocument,
  Supplier,
  WeddingBus,
  WeddingTable
} from "@/lib/types";

interface DemoDocument extends WeddingDocument {
  content_base64: string;
}

interface WeddingSettings {
  iban: string;
  ibanHolder: string;
  ibanConcept: string;
  contactPhone: string;
  contactEmail: string;
  hotelSuggestions: string;
}

interface DemoState {
  guests: Guest[];
  tables: WeddingTable[];
  buses: WeddingBus[];
  busAssignments: BusAssignment[];
  suppliers: Supplier[];
  documents: DemoDocument[];
  auditEvents: AuditEvent[];
  tasks: PlannerTask[];
  budgetItems: BudgetItem[];
  timelineEvents: TimelineEvent[];
  settings?: WeddingSettings;
  legacyGuestIdAliases?: Record<string, string>;
}

const trackingDefaults = {
  rsvp_first_view_at: null as string | null,
  rsvp_last_view_at: null as string | null,
  rsvp_view_count: 0,
  rsvp_first_submitted_at: null as string | null,
  rsvp_last_submitted_at: null as string | null,
  rsvp_submit_count: 0,
  rsvp_last_locale: null as string | null
};

const demoStatePath = path.join(os.tmpdir(), "boda-wedding-demo-state.json");

/* Versión del contenido sembrado. Si el fichero persistido en tmp proviene de un
   seed anterior (textos viejos: sin tildes, marca en otro orden…), se descarta y
   se re-siembra: borrarlo a mano demostró no ser durable (recurrió en crítica). */
const DEMO_SEED_VERSION = 2;

const demoGuestLegacyIdAliases: Record<string, string> = {
  "1af45817-d86a-4852-bc9d-148661b800eb": "55555555-5555-4555-8555-555555555550"
};

function now() {
  return new Date().toISOString();
}

function demoIds() {
  return {
    tableA: "11111111-1111-4111-8111-111111111111",
    tableB: "11111111-1111-4111-8111-111111111112",
    tableC: "11111111-1111-4111-8111-111111111113",
    busA: "22222222-2222-4222-8222-222222222221",
    busB: "22222222-2222-4222-8222-222222222222",
    supplierA: "33333333-3333-4333-8333-333333333331",
    supplierB: "33333333-3333-4333-8333-333333333332",
    supplierC: "33333333-3333-4333-8333-333333333333",
    documentA: "44444444-4444-4444-8444-444444444441",
    documentB: "44444444-4444-4444-8444-444444444442",
    documentC: "44444444-4444-4444-8444-444444444443",
    guestA: "55555555-5555-4555-8555-555555555551",
    guestB: "55555555-5555-4555-8555-555555555552",
    guestC: "55555555-5555-4555-8555-555555555553",
    guestD: "55555555-5555-4555-8555-555555555554",
    taskA: "66666666-6666-4666-8666-666666666661",
    taskB: "66666666-6666-4666-8666-666666666662",
    taskC: "66666666-6666-4666-8666-666666666663",
    budgetA: "77777777-7777-4777-8777-777777777771",
    budgetB: "77777777-7777-4777-8777-777777777772",
    budgetC: "77777777-7777-4777-8777-777777777773"
  };
}

function remapEntityId<T extends { id: string }>(
  items: T[],
  stableId: string,
  predicate: (item: T) => boolean,
  remap: Map<string, string>
) {
  const item = items.find(predicate);

  if (!item || item.id === stableId) {
    return false;
  }

  remap.set(item.id, stableId);
  item.id = stableId;
  return true;
}

function replaceMappedId(value: string | null | undefined, remap: Map<string, string>) {
  return value ? remap.get(value) ?? value : value;
}

function stabilizeDemoSeedIds(state: DemoState) {
  const ids = demoIds();
  const tableIds = new Map<string, string>();
  const busIds = new Map<string, string>();
  const supplierIds = new Map<string, string>();
  const documentIds = new Map<string, string>();
  const guestIds = new Map<string, string>();
  let changed = false;

  changed = remapEntityId(state.tables, ids.tableA, (table) => table.nombre === "Mesa 1 - Familia", tableIds) || changed;
  changed = remapEntityId(state.tables, ids.tableB, (table) => table.nombre === "Mesa 2 - Amigos", tableIds) || changed;
  changed = remapEntityId(state.tables, ids.tableC, (table) => table.nombre === "Mesa 3 - Trabajo", tableIds) || changed;

  changed = remapEntityId(state.buses, ids.busA, (bus) => bus.nombre === "Bus Centro", busIds) || changed;
  changed = remapEntityId(state.buses, ids.busB, (bus) => bus.nombre === "Bus Norte", busIds) || changed;

  changed = remapEntityId(state.suppliers, ids.supplierA, (supplier) => supplier.nombre === "Casa del Lago", supplierIds) || changed;
  changed = remapEntityId(state.suppliers, ids.supplierB, (supplier) => supplier.nombre === "Floristería Clara", supplierIds) || changed;
  changed = remapEntityId(state.suppliers, ids.supplierC, (supplier) => supplier.nombre === "Sol y Banda", supplierIds) || changed;

  changed = remapEntityId(state.documents, ids.documentA, (document) => document.nombre === "Contrato catering", documentIds) || changed;
  changed = remapEntityId(state.documents, ids.documentB, (document) => document.nombre === "Plano mesas", documentIds) || changed;
  changed = remapEntityId(state.documents, ids.documentC, (document) => document.nombre === "Presupuesto música", documentIds) || changed;

  changed =
    remapEntityId(
      state.guests,
      ids.guestA,
      (guest) => guest.codigo_invitacion === "K7N4Q" || `${guest.nombre} ${guest.apellidos}` === "Laura Garcia",
      guestIds
    ) || changed;
  changed =
    remapEntityId(
      state.guests,
      ids.guestB,
      (guest) => guest.codigo_invitacion === "R8P2M" || `${guest.nombre} ${guest.apellidos}` === "Marcos Lopez",
      guestIds
    ) || changed;
  changed =
    remapEntityId(
      state.guests,
      ids.guestC,
      (guest) => guest.codigo_invitacion === "V3H7C" || `${guest.nombre} ${guest.apellidos}` === "Ana Torres",
      guestIds
    ) || changed;
  changed =
    remapEntityId(
      state.guests,
      ids.guestD,
      (guest) => guest.codigo_invitacion === "L6Q9T" || `${guest.nombre} ${guest.apellidos}` === "Diego Martin",
      guestIds
    ) || changed;

  if (guestIds.size > 0) {
    state.legacyGuestIdAliases = {
      ...state.legacyGuestIdAliases,
      ...Object.fromEntries(guestIds)
    };
  }

  changed = remapEntityId(state.tasks, ids.taskA, (task) => task.titulo === "Cerrar horario de ceremonia", new Map()) || changed;
  changed = remapEntityId(state.tasks, ids.taskB, (task) => task.titulo === "Elegir música de entrada", new Map()) || changed;
  changed = remapEntityId(state.tasks, ids.taskC, (task) => task.titulo === "Confirmar lista de invitados", new Map()) || changed;

  changed = remapEntityId(state.budgetItems, ids.budgetA, (item) => item.categoria === "Catering" && item.concepto === "Menú principal", new Map()) || changed;
  changed = remapEntityId(state.budgetItems, ids.budgetB, (item) => item.categoria === "Decoración" && item.concepto === "Flores y mesas", new Map()) || changed;
  changed = remapEntityId(state.budgetItems, ids.budgetC, (item) => item.categoria === "Música" && item.concepto === "Grupo en directo", new Map()) || changed;

  for (const guest of state.guests) {
    const nextTableId = replaceMappedId(guest.mesa_id, tableIds);
    if (nextTableId !== guest.mesa_id) {
      guest.mesa_id = nextTableId ?? null;
      changed = true;
    }
  }

  for (const assignment of state.busAssignments) {
    const nextBusId = replaceMappedId(assignment.autobus_id, busIds);
    const nextGuestId = replaceMappedId(assignment.invitado_id, guestIds);

    if (nextBusId !== assignment.autobus_id || nextGuestId !== assignment.invitado_id) {
      assignment.autobus_id = nextBusId ?? assignment.autobus_id;
      assignment.invitado_id = nextGuestId ?? assignment.invitado_id;
      changed = true;
    }
  }

  for (const document of state.documents) {
    const nextSupplierId = replaceMappedId(document.proveedor_id, supplierIds);

    if (nextSupplierId !== document.proveedor_id) {
      document.proveedor_id = nextSupplierId ?? null;
      changed = true;
    }
  }

  for (const event of state.auditEvents) {
    const remap =
      event.entity_type === "invitado"
        ? guestIds
        : event.entity_type === "proveedor"
          ? supplierIds
          : event.entity_type === "documento"
            ? documentIds
            : null;
    const nextEntityId = remap ? replaceMappedId(event.entity_id, remap) : event.entity_id;

    if (nextEntityId !== event.entity_id) {
      event.entity_id = nextEntityId ?? event.entity_id;
      changed = true;
    }
  }

  return changed;
}

function ensureDemoInvitationCodes(guests: Guest[]) {
  const usedCodes = new Set<string>();
  let changed = false;

  const hydratedGuests = guests.map((guest) => {
    const normalizedCode = normalizeInvitationCode(guest.codigo_invitacion ?? "");
    const code = normalizedCode && !usedCodes.has(normalizedCode) ? normalizedCode : generateInvitationCode(usedCodes);

    if (code !== guest.codigo_invitacion) {
      changed = true;
    }

    usedCodes.add(code);

    return {
      ...guest,
      codigo_invitacion: code
    };
  });

  return { guests: hydratedGuests, changed };
}

function encodeDemoDocument(content: string) {
  return Buffer.from(content, "utf8").toString("base64");
}

function buildDemoDocumentDownloadUrl(document: DemoDocument) {
  const mimeType = document.mime_type ?? "application/octet-stream";
  return `data:${mimeType};base64,${document.content_base64}`;
}

function buildAuditEventsFromState(state: Pick<DemoState, "guests" | "suppliers" | "documents">) {
  const events: AuditEvent[] = [];

  for (const guest of state.guests) {
    const guestName = `${guest.nombre} ${guest.apellidos}`.trim();
    events.push({
      id: randomUUID(),
      entity_type: "invitado",
      entity_id: guest.id,
      action: "created",
      title: guestName,
      details: `Invitado creado. Mesa: ${guest.mesa_nombre ?? "Sin mesa"}. Autobús: ${guest.necesita_autobus ? "sí" : "no"}.`,
      created_at: guest.created_at
    });

    if (guest.updated_at !== guest.created_at) {
      events.push({
        id: randomUUID(),
        entity_type: "invitado",
        entity_id: guest.id,
        action: "updated",
        title: guestName,
        details: "Registro actualizado.",
        created_at: guest.updated_at
      });
    }
  }

  for (const supplier of state.suppliers) {
    events.push({
      id: randomUUID(),
      entity_type: "proveedor",
      entity_id: supplier.id,
      action: "created",
      title: supplier.nombre,
      details: `Proveedor creado. Tipo: ${supplier.tipo}.`,
      created_at: supplier.created_at
    });

    if (supplier.updated_at !== supplier.created_at) {
      events.push({
        id: randomUUID(),
        entity_type: "proveedor",
        entity_id: supplier.id,
        action: "updated",
        title: supplier.nombre,
        details: "Registro actualizado.",
        created_at: supplier.updated_at
      });
    }
  }

  for (const document of state.documents) {
    events.push({
      id: randomUUID(),
      entity_type: "documento",
      entity_id: document.id,
      action: "created",
      title: document.nombre,
      details: `Documento creado. Archivo: ${document.archivo_nombre}.`,
      created_at: document.created_at
    });

    if (document.updated_at !== document.created_at) {
      events.push({
        id: randomUUID(),
        entity_type: "documento",
        entity_id: document.id,
        action: "updated",
        title: document.nombre,
        details: "Registro actualizado.",
        created_at: document.updated_at
      });
    }
  }

  return events.sort((left, right) => left.created_at.localeCompare(right.created_at));
}

function createInitialDemoState(): DemoState {
  const ids = demoIds();
  const createdAt = "2026-05-12T10:00:00.000Z";

  return {
    timelineEvents: [],
    tables: [
      { id: ids.tableA, nombre: "Mesa 1 - Familia", capacidad: 8, notas: "Familia cercana y padrinos." },
      { id: ids.tableB, nombre: "Mesa 2 - Amigos", capacidad: 8, notas: "Amistades de toda la vida." },
      { id: ids.tableC, nombre: "Mesa 3 - Trabajo", capacidad: 8, notas: "Compañeros y personas del día a día." }
    ],
    buses: [
      {
        id: ids.busA,
        nombre: "Bus Centro",
        proveedor: "Autocares Ejemplo",
        capacidad: 55,
        paradas: ["Plaza Mayor", "Finca de ejemplo"],
        horarios: "Ida 15:30 · Vueltas 00:00 y 02:00",
        estado: "confirmado",
        notas: "Subida y bajada en el mismo punto."
      },
      {
        id: ids.busB,
        nombre: "Bus Norte (opcional)",
        proveedor: "Autocares Ejemplo",
        capacidad: 40,
        paradas: ["Estación Norte", "Avenida Principal"],
        horarios: "Por confirmar según demanda",
        estado: "cotizado",
        notas: "Ruta secundaria pendiente de demanda mínima."
      }
    ],
    busAssignments: [
      { autobus_id: ids.busA, invitado_id: ids.guestB },
      { autobus_id: ids.busA, invitado_id: ids.guestD }
    ],
    suppliers: [
      {
        id: ids.supplierA,
        nombre: "Casa del Lago",
        tipo: "Catering",
        email: "info@casadellago.example",
        telefono: "933 111 222",
        web: "https://casadellago.example",
        precio: 12800,
        estado: "reservado",
        notas: "Menú principal con aperitivo y servicio completo.",
        created_at: createdAt,
        updated_at: createdAt
      },
      {
        id: ids.supplierB,
        nombre: "Floristería Clara",
        tipo: "Decoración",
        email: "hola@floristeriaclara.example",
        telefono: "932 555 000",
        web: null,
        precio: 2800,
        estado: "cotizado",
        notas: "Flores de mesas y ceremonia.",
        created_at: createdAt,
        updated_at: createdAt
      },
      {
        id: ids.supplierC,
        nombre: "Sol y Banda",
        tipo: "Música",
        email: "booking@solybanda.example",
        telefono: null,
        web: "https://solybanda.example",
        precio: 1900,
        estado: "contactado",
        notas: "Grupo en directo para el banquete.",
        created_at: createdAt,
        updated_at: createdAt
      }
    ],
    documents: [
      {
        id: ids.documentA,
        nombre: "Contrato catering",
        archivo_nombre: "contrato-catering.txt",
        tipo: "Contrato",
        mime_type: "text/plain",
        tamano_bytes: 38,
        storage_path: `${ids.documentA}/contrato-catering.txt`,
        proveedor_id: ids.supplierA,
        notas: "Pendiente de firma final.",
        content_base64: encodeDemoDocument("Contrato de catering pendiente de firma"),
        created_at: createdAt,
        updated_at: createdAt
      },
      {
        id: ids.documentB,
        nombre: "Plano mesas",
        archivo_nombre: "plano-mesas.txt",
        tipo: "Plano",
        mime_type: "text/plain",
        tamano_bytes: 31,
        storage_path: `${ids.documentB}/plano-mesas.txt`,
        proveedor_id: null,
        notas: "Distribución tentativa del banquete.",
        content_base64: encodeDemoDocument("Plano de mesas provisional"),
        created_at: createdAt,
        updated_at: createdAt
      },
      {
        id: ids.documentC,
        nombre: "Presupuesto música",
        archivo_nombre: "presupuesto-música.txt",
        tipo: "Presupuesto",
        mime_type: "text/plain",
        tamano_bytes: 34,
        storage_path: `${ids.documentC}/presupuesto-música.txt`,
        proveedor_id: ids.supplierC,
        notas: "Última versión enviada por la banda.",
        content_base64: encodeDemoDocument("Presupuesto de música actualizado"),
        created_at: createdAt,
        updated_at: createdAt
      }
    ],
    guests: [
      {
        id: ids.guestA,
        nombre: "Laura",
        apellidos: "Garcia",
        email: "laura@example.com",
        telefono: "600 111 222",
        grupo: "Familia 1",
        confirmacion_asistencia: "confirmado",
        menu_elegido: "adulto",
        alergias_intolerancias: null,
        necesita_autobus: false,
        hotel_alojamiento: null,
        mesa_id: ids.tableA,
        notas_internas: "Mesa principal",
        comentarios: null,
        rsvp_token: "demo-laura-garcia-2027",
        codigo_invitacion: "K7N4Q",
        ...trackingDefaults,
        rsvp_view_count: 2,
        rsvp_submit_count: 1,
        rsvp_first_view_at: createdAt,
        rsvp_last_view_at: createdAt,
        rsvp_first_submitted_at: createdAt,
        rsvp_last_submitted_at: createdAt,
        created_at: createdAt,
        updated_at: createdAt
      },
      {
        id: ids.guestB,
        nombre: "Marcos",
        apellidos: "Lopez",
        email: "marcos@example.com",
        telefono: "600 333 444",
        grupo: "Amigos",
        confirmacion_asistencia: "pendiente",
        menu_elegido: "pendiente",
        alergias_intolerancias: null,
        necesita_autobus: true,
        hotel_alojamiento: "Hotel Centro",
        mesa_id: ids.tableB,
        notas_internas: "Confirmar transporte",
        comentarios: null,
        rsvp_token: "demo-marcos-lopez-2027",
        codigo_invitacion: "R8P2M",
        ...trackingDefaults,
        created_at: createdAt,
        updated_at: createdAt
      },
      {
        id: ids.guestC,
        nombre: "Ana",
        apellidos: "Torres",
        email: null,
        telefono: null,
        grupo: "Trabajo",
        confirmacion_asistencia: "confirmado",
        menu_elegido: "vegetariano",
        alergias_intolerancias: "Sin frutos secos",
        necesita_autobus: false,
        hotel_alojamiento: null,
        mesa_id: ids.tableC,
        notas_internas: "Alergia importante",
        comentarios: null,
        rsvp_token: "demo-ana-torres-2027",
        codigo_invitacion: "V3H7C",
        ...trackingDefaults,
        rsvp_view_count: 2,
        rsvp_submit_count: 1,
        rsvp_first_view_at: createdAt,
        rsvp_last_view_at: createdAt,
        rsvp_first_submitted_at: createdAt,
        rsvp_last_submitted_at: createdAt,
        created_at: createdAt,
        updated_at: createdAt
      },
      {
        id: ids.guestD,
        nombre: "Diego",
        apellidos: "Martin",
        email: "diego@example.com",
        telefono: null,
        grupo: "Familia 2",
        confirmacion_asistencia: "rechazado",
        menu_elegido: "pendiente",
        alergias_intolerancias: null,
        necesita_autobus: false,
        hotel_alojamiento: null,
        mesa_id: null,
        notas_internas: "No asiste, avisado por teléfono",
        comentarios: "Gracias por la invitacion",
        rsvp_token: "demo-diego-martin-2027",
        codigo_invitacion: "L6Q9T",
        ...trackingDefaults,
        rsvp_view_count: 2,
        rsvp_submit_count: 1,
        rsvp_first_view_at: createdAt,
        rsvp_last_view_at: createdAt,
        rsvp_first_submitted_at: createdAt,
        rsvp_last_submitted_at: createdAt,
        created_at: createdAt,
        updated_at: createdAt
      }
    ],
    auditEvents: buildAuditEventsFromState({
      guests: [
        {
          id: ids.guestA,
          nombre: "Laura",
          apellidos: "Garcia",
          email: "laura@example.com",
          telefono: "600 111 222",
          grupo: "Familia 1",
          confirmacion_asistencia: "confirmado",
          menu_elegido: "adulto",
          alergias_intolerancias: null,
          necesita_autobus: false,
          hotel_alojamiento: null,
          mesa_id: ids.tableA,
          notas_internas: "Mesa principal",
          comentarios: null,
          rsvp_token: "demo-laura-garcia-2027",
          codigo_invitacion: "K7N4Q",
          ...trackingDefaults,
          rsvp_view_count: 2,
          rsvp_submit_count: 1,
          rsvp_first_view_at: createdAt,
          rsvp_last_view_at: createdAt,
          rsvp_first_submitted_at: createdAt,
          rsvp_last_submitted_at: createdAt,
          created_at: createdAt,
          updated_at: createdAt
        },
        {
          id: ids.guestB,
          nombre: "Marcos",
          apellidos: "Lopez",
          email: "marcos@example.com",
          telefono: "600 333 444",
          grupo: "Amigos",
          confirmacion_asistencia: "pendiente",
          menu_elegido: "pendiente",
          alergias_intolerancias: null,
          necesita_autobus: true,
          hotel_alojamiento: "Hotel Centro",
          mesa_id: ids.tableB,
          notas_internas: "Confirmar transporte",
          comentarios: null,
          rsvp_token: "demo-marcos-lopez-2027",
          codigo_invitacion: "R8P2M",
          ...trackingDefaults,
          created_at: createdAt,
          updated_at: createdAt
        },
        {
          id: ids.guestC,
          nombre: "Ana",
          apellidos: "Torres",
          email: null,
          telefono: null,
          grupo: "Trabajo",
          confirmacion_asistencia: "confirmado",
          menu_elegido: "vegetariano",
          alergias_intolerancias: "Sin frutos secos",
          necesita_autobus: false,
          hotel_alojamiento: null,
          mesa_id: ids.tableC,
          notas_internas: "Alergia importante",
          comentarios: null,
          rsvp_token: "demo-ana-torres-2027",
          codigo_invitacion: "V3H7C",
          ...trackingDefaults,
          rsvp_view_count: 2,
          rsvp_submit_count: 1,
          rsvp_first_view_at: createdAt,
          rsvp_last_view_at: createdAt,
          rsvp_first_submitted_at: createdAt,
          rsvp_last_submitted_at: createdAt,
          created_at: createdAt,
          updated_at: createdAt
        },
        {
          id: ids.guestD,
          nombre: "Diego",
          apellidos: "Martin",
          email: "diego@example.com",
          telefono: null,
          grupo: "Familia 2",
          confirmacion_asistencia: "rechazado",
          menu_elegido: "pendiente",
          alergias_intolerancias: null,
          necesita_autobus: false,
          hotel_alojamiento: null,
          mesa_id: null,
          notas_internas: "No asiste, avisado por teléfono",
          comentarios: "Gracias por la invitacion",
          rsvp_token: "demo-diego-martin-2027",
          codigo_invitacion: "L6Q9T",
          ...trackingDefaults,
          rsvp_view_count: 2,
          rsvp_submit_count: 1,
          rsvp_first_view_at: createdAt,
          rsvp_last_view_at: createdAt,
          rsvp_first_submitted_at: createdAt,
          rsvp_last_submitted_at: createdAt,
          created_at: createdAt,
          updated_at: createdAt
        }
      ],
      suppliers: [
        {
          id: ids.supplierA,
          nombre: "Casa del Lago",
          tipo: "Catering",
          email: "info@casadellago.example",
          telefono: "933 111 222",
          web: "https://casadellago.example",
          precio: 12800,
          estado: "reservado",
          notas: "Menú principal con aperitivo y servicio completo.",
          created_at: createdAt,
          updated_at: createdAt
        },
        {
          id: ids.supplierB,
          nombre: "Floristería Clara",
          tipo: "Decoración",
          email: "hola@floristeriaclara.example",
          telefono: "932 555 000",
          web: null,
          precio: 2800,
          estado: "cotizado",
          notas: "Flores de mesas y ceremonia.",
          created_at: createdAt,
          updated_at: createdAt
        },
        {
          id: ids.supplierC,
          nombre: "Sol y Banda",
          tipo: "Música",
          email: "booking@solybanda.example",
          telefono: null,
          web: "https://solybanda.example",
          precio: 1900,
          estado: "contactado",
          notas: "Grupo en directo para el banquete.",
          created_at: createdAt,
          updated_at: createdAt
        }
      ],
      documents: [
        {
          id: ids.documentA,
          nombre: "Contrato catering",
          archivo_nombre: "contrato-catering.txt",
          tipo: "Contrato",
          mime_type: "text/plain",
          tamano_bytes: 38,
          storage_path: `${ids.documentA}/contrato-catering.txt`,
          proveedor_id: ids.supplierA,
          notas: "Pendiente de firma final.",
          content_base64: encodeDemoDocument("Contrato de catering pendiente de firma"),
          created_at: createdAt,
          updated_at: createdAt
        },
        {
          id: ids.documentB,
          nombre: "Plano mesas",
          archivo_nombre: "plano-mesas.txt",
          tipo: "Plano",
          mime_type: "text/plain",
          tamano_bytes: 31,
          storage_path: `${ids.documentB}/plano-mesas.txt`,
          proveedor_id: null,
          notas: "Distribución tentativa del banquete.",
          content_base64: encodeDemoDocument("Plano de mesas provisional"),
          created_at: createdAt,
          updated_at: createdAt
        },
        {
          id: ids.documentC,
          nombre: "Presupuesto música",
          archivo_nombre: "presupuesto-música.txt",
          tipo: "Presupuesto",
          mime_type: "text/plain",
          tamano_bytes: 34,
          storage_path: `${ids.documentC}/presupuesto-música.txt`,
          proveedor_id: ids.supplierC,
          notas: "Versión pendiente de revisión.",
          content_base64: encodeDemoDocument("Presupuesto de música"),
          created_at: createdAt,
          updated_at: createdAt
        }
      ]
    }),
    tasks: [
      {
        id: ids.taskA,
        titulo: "Cerrar horario de ceremonia",
        descripcion: "Ajustar entrada, salida y fotos con la familia.",
        responsable: "ambos",
        fecha_limite: "2027-03-10",
        estado: "pendiente",
        prioridad: "alta",
        created_at: createdAt,
        updated_at: createdAt
      },
      {
        id: ids.taskB,
        titulo: "Elegir música de entrada",
        descripcion: "Preparar una lista corta de canciones.",
        responsable: "uno",
        fecha_limite: "2027-03-24",
        estado: "en_progreso",
        prioridad: "media",
        created_at: createdAt,
        updated_at: createdAt
      },
      {
        id: ids.taskC,
        titulo: "Confirmar lista de invitados",
        descripcion: "Revisar pendientes y mesas antes de enviar últimos avisos.",
        responsable: "dos",
        fecha_limite: "2027-04-01",
        estado: "pendiente",
        prioridad: "media",
        created_at: createdAt,
        updated_at: createdAt
      }
    ],
    budgetItems: [
      {
        id: ids.budgetA,
        categoria: "Catering",
        concepto: "Menú principal",
        proveedor: "Casa del Lago",
        coste_estimado: 12800,
        coste_real: 6400,
        estado_pago: "parcial",
        fecha_pago: "2027-02-18",
        notas: "Incluye aperitivo y menú de adultos",
        created_at: createdAt,
        updated_at: createdAt
      },
      {
        id: ids.budgetB,
        categoria: "Decoración",
        concepto: "Flores y mesas",
        proveedor: "Floristería Clara",
        coste_estimado: 2800,
        coste_real: 1200,
        estado_pago: "parcial",
        fecha_pago: null,
        notas: "Pendiente confirmar colores finales",
        created_at: createdAt,
        updated_at: createdAt
      },
      {
        id: ids.budgetC,
        categoria: "Música",
        concepto: "Grupo en directo",
        proveedor: "Sol y Banda",
        coste_estimado: 1900,
        coste_real: 0,
        estado_pago: "pendiente",
        fecha_pago: null,
        notas: "Reservado, falta adelanto",
        created_at: createdAt,
        updated_at: createdAt
      }
    ],
    settings: {
      iban: "ES00 0000 0000 0000 0000 0000",
      ibanHolder: "",
      ibanConcept: "",
      contactPhone: "",
      contactEmail: "",
      hotelSuggestions: ""
    }
  };
}

async function loadDemoState(): Promise<DemoState> {
  try {
    const raw = await readFile(demoStatePath, "utf8");
    const parsed = JSON.parse(raw) as DemoState & { seedVersion?: number };
    if ((parsed.seedVersion ?? 1) !== DEMO_SEED_VERSION) {
      return createInitialDemoState();
    }
    const initialState = createInitialDemoState();
    const hydratedMissingFields =
      parsed.buses === undefined ||
      parsed.busAssignments === undefined ||
      parsed.suppliers === undefined ||
      parsed.documents === undefined ||
      parsed.auditEvents === undefined;
    const guests = parsed.guests ?? initialState.guests;
    const tables = parsed.tables ?? initialState.tables;
    const buses = parsed.buses ?? initialState.buses;
    const busAssignments = parsed.busAssignments ?? initialState.busAssignments;
    const suppliers = parsed.suppliers ?? initialState.suppliers;
    const documents = parsed.documents ?? initialState.documents;
    const tasks = parsed.tasks ?? initialState.tasks;
    const budgetItems = parsed.budgetItems ?? initialState.budgetItems;
    const timelineEvents = parsed.timelineEvents ?? initialState.timelineEvents;
    const settings = parsed.settings ?? initialState.settings;
    const state = {
      ...parsed,
      guests,
      tables,
      buses,
      busAssignments,
      suppliers,
      documents,
      auditEvents: parsed.auditEvents ?? buildAuditEventsFromState({
        guests,
        suppliers,
        documents
      }),
      tasks,
      budgetItems,
      timelineEvents,
      settings
    };

    const stabilizedIds = stabilizeDemoSeedIds(state);
    const { guests: hydratedGuests, changed } = ensureDemoInvitationCodes(state.guests);
    const hydratedState = {
      ...parsed,
      tables: state.tables,
      buses: state.buses,
      busAssignments: state.busAssignments,
      suppliers: state.suppliers,
      documents: state.documents,
      auditEvents: state.auditEvents,
      tasks: state.tasks,
      budgetItems: state.budgetItems,
      timelineEvents: state.timelineEvents,
      settings: state.settings,
      legacyGuestIdAliases: state.legacyGuestIdAliases,
      guests: hydratedGuests.map((guest) => ({
        ...trackingDefaults,
        ...guest,
        rsvp_first_view_at: guest.rsvp_first_view_at ?? null,
        rsvp_last_view_at: guest.rsvp_last_view_at ?? null,
        rsvp_view_count: guest.rsvp_view_count ?? 0,
        rsvp_first_submitted_at: guest.rsvp_first_submitted_at ?? null,
        rsvp_last_submitted_at: guest.rsvp_last_submitted_at ?? null,
        rsvp_submit_count: guest.rsvp_submit_count ?? 0,
        rsvp_last_locale: guest.rsvp_last_locale ?? null
      }))
    };

    if (hydratedMissingFields || changed || stabilizedIds) {
      await saveDemoState(hydratedState);
    }

    return {
      ...hydratedState
    };
  } catch {
    const state = createInitialDemoState();
    state.auditEvents = buildAuditEventsFromState({
      guests: state.guests,
      suppliers: state.suppliers,
      documents: state.documents
    });
    await saveDemoState(state);
    return state;
  }
}

async function saveDemoState(state: DemoState) {
  await writeFile(demoStatePath, JSON.stringify({ ...state, seedVersion: DEMO_SEED_VERSION }, null, 2), "utf8");
}

async function updateDemoState(mutator: (state: DemoState) => void | Promise<void>) {
  const state = await loadDemoState();
  await mutator(state);
  await saveDemoState(state);
  return state;
}

function buildSummary(state: DemoState): DashboardSummary {
  const totalGuests = state.guests.length;
  const confirmedGuests = state.guests.filter((guest) => guest.confirmacion_asistencia === "confirmado").length;
  const pendingGuests = state.guests.filter((guest) => guest.confirmacion_asistencia === "pendiente").length;
  const plannedBudget = state.budgetItems.reduce((total, item) => total + item.coste_estimado, 0);
  const spentBudget = state.budgetItems.reduce((total, item) => total + item.coste_real, 0);
  const pendingTasks = state.tasks.filter((task) => task.estado !== "hecha").length;
  const assignedTables = state.tables.filter((table) => state.guests.some((guest) => guest.mesa_id === table.id)).length;
  const assignedBuses = state.buses.filter((bus) => state.busAssignments.some((assignment) => assignment.autobus_id === bus.id)).length;

  return {
    total_invitados: totalGuests,
    invitados_confirmados: confirmedGuests,
    invitados_pendientes: pendingGuests,
    presupuesto_previsto: plannedBudget,
    presupuesto_gastado: spentBudget,
    tareas_pendientes: pendingTasks,
    mesas_asignadas: assignedTables,
    autobuses_asignados: assignedBuses,
    proveedores_totales: state.suppliers.length,
    documentos_totales: state.documents.length
  };
}

function mapGuestForRsvp(guest: Guest): RsvpGuest {
  return {
    nombre: guest.nombre,
    apellidos: guest.apellidos,
    grupo: guest.grupo,
    confirmacion_asistencia: guest.confirmacion_asistencia,
    menu_elegido: guest.menu_elegido,
    alergias_intolerancias: guest.alergias_intolerancias,
    necesita_autobus: guest.necesita_autobus,
    hotel_alojamiento: guest.hotel_alojamiento,
    comentarios: guest.comentarios,
    cancion_sugerida: guest.cancion_sugerida ?? null
  };
}

function findDemoGuestByAccessKey(state: DemoState, accessKey: string) {
  const normalizedAccessKey = normalizeInvitationCode(accessKey);

  return state.guests.find((guest) => {
    if (guest.rsvp_token === accessKey) {
      return true;
    }

    return normalizeInvitationCode(guest.codigo_invitacion) === normalizedAccessKey;
  });
}

export async function getDemoDashboardData() {
  const state = await loadDemoState();
  return {
    summary: buildSummary(state),
    upcomingTasks: state.tasks
      .filter((task) => task.estado !== "hecha")
      .sort((left, right) => (left.fecha_limite ?? "").localeCompare(right.fecha_limite ?? "")),
    setupPending: false
  };
}

export async function getDemoGuests() {
  const state = await loadDemoState();

  return state.guests.map((guest) => ({
    ...guest,
    mesa_nombre: state.tables.find((table) => table.id === guest.mesa_id)?.nombre ?? null
  }));
}

export async function getDemoTables() {
  const state = await loadDemoState();
  return state.tables;
}

export async function getDemoTableById(id: string) {
  const state = await loadDemoState();
  return state.tables.find((table) => table.id === id) ?? null;
}

export async function getDemoBuses() {
  const state = await loadDemoState();
  return state.buses;
}

export async function getDemoBusById(id: string) {
  const state = await loadDemoState();
  return state.buses.find((bus) => bus.id === id) ?? null;
}

export async function getDemoBusAssignments() {
  const state = await loadDemoState();
  return state.busAssignments;
}

export async function getDemoSuppliers() {
  const state = await loadDemoState();
  return state.suppliers;
}

export async function getDemoSupplierById(id: string) {
  const state = await loadDemoState();
  return state.suppliers.find((supplier) => supplier.id === id) ?? null;
}

export async function getDemoDocuments() {
  const state = await loadDemoState();

  return state.documents
    .map((document) => ({
      ...document,
      download_url: buildDemoDocumentDownloadUrl(document),
      proveedor_nombre: state.suppliers.find((supplier) => supplier.id === document.proveedor_id)?.nombre ?? null
    }))
    .sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export async function getDemoDocumentById(id: string) {
  const state = await loadDemoState();
  const document = state.documents.find((item) => item.id === id);

  if (!document) {
    return null;
  }

  return {
    ...document,
    download_url: buildDemoDocumentDownloadUrl(document),
    proveedor_nombre: state.suppliers.find((supplier) => supplier.id === document.proveedor_id)?.nombre ?? null
  };
}

export async function getDemoAuditEvents(entityType: AuditEvent["entity_type"], entityId: string) {
  const state = await loadDemoState();
  return state.auditEvents
    .filter((event) => event.entity_type === entityType && event.entity_id === entityId)
    .sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export async function getDemoTasks() {
  const state = await loadDemoState();
  return state.tasks;
}

export async function getDemoBudgetItems() {
  const state = await loadDemoState();
  return state.budgetItems;
}

export async function getDemoTimelineEvents(): Promise<TimelineEvent[]> {
  const state = await loadDemoState();
  return state.timelineEvents.sort((a, b) => a.hora.localeCompare(b.hora));
}

export async function createDemoTimelineEvent(
  values: Pick<TimelineEvent, "hora" | "titulo" | "descripcion" | "titulo_ca" | "descripcion_ca">
) {
  const state = await loadDemoState();
  const event: TimelineEvent = {
    id: randomUUID(),
    hora: values.hora,
    titulo: values.titulo,
    descripcion: values.descripcion,
    titulo_ca: values.titulo_ca,
    descripcion_ca: values.descripcion_ca,
    fijo: false,
    created_at: now()
  };
  state.timelineEvents.push(event);
  await saveDemoState(state);
}

export async function updateDemoTimelineEvent(
  id: string,
  values: Pick<TimelineEvent, "hora" | "titulo" | "descripcion" | "titulo_ca" | "descripcion_ca">
) {
  const state = await loadDemoState();
  const event = state.timelineEvents.find((e) => e.id === id);
  if (event) {
    event.hora = values.hora;
    event.titulo = values.titulo;
    event.descripcion = values.descripcion;
    event.titulo_ca = values.titulo_ca;
    event.descripcion_ca = values.descripcion_ca;
    await saveDemoState(state);
  }
}

export async function deleteDemoTimelineEvent(id: string) {
  const state = await loadDemoState();
  state.timelineEvents = state.timelineEvents.filter((e) => e.id !== id);
  await saveDemoState(state);
}

export async function getDemoCateringGuests(): Promise<CateringGuest[]> {
  const state = await loadDemoState();
  const confirmed = state.guests.filter((guest) => guest.confirmacion_asistencia === "confirmado");
  const tableMap = new Map(state.tables.map((table) => [table.id, table.nombre]));

  return confirmed
    .sort((left, right) => left.menu_elegido.localeCompare(right.menu_elegido) || left.apellidos.localeCompare(right.apellidos))
    .map((guest) => ({
      id: guest.id,
      nombre: guest.nombre,
      apellidos: guest.apellidos,
      grupo: guest.grupo,
      menu_elegido: guest.menu_elegido,
      alergias_intolerancias: guest.alergias_intolerancias,
      mesa_nombre: guest.mesa_id ? (tableMap.get(guest.mesa_id) ?? null) : null,
      necesita_autobus: guest.necesita_autobus
    }));
}

export async function getDemoRsvpGuest(token: string) {
  const state = await loadDemoState();
  const guest = findDemoGuestByAccessKey(state, token);
  return guest ? mapGuestForRsvp(guest) : null;
}

export async function getDemoRsvpExtras(token: string) {
  const state = await loadDemoState();
  const guest = findDemoGuestByAccessKey(state, token);
  if (!guest) return null;

  const table = guest.mesa_id ? state.tables.find((t) => t.id === guest.mesa_id) ?? null : null;
  const tablemates = guest.mesa_id
    ? state.guests
        .filter((g) => g.mesa_id === guest.mesa_id)
        .sort((a, b) => a.apellidos.localeCompare(b.apellidos))
        .map((g) => ({
          nombre: g.nombre,
          apellidos: g.apellidos,
          grupo: g.grupo,
          menu_elegido: g.menu_elegido,
          is_self: g.id === guest.id
        }))
    : [];

  // Bus assignment lookup
  const busAssignment = state.busAssignments?.find((b) => b.invitado_id === guest.id);
  const bus = busAssignment ? state.buses.find((b) => b.id === busAssignment.autobus_id) ?? null : null;

  return {
    mesa_id: guest.mesa_id ?? null,
    mesa_nombre: table?.nombre ?? null,
    mesa_capacidad: table?.capacidad ?? null,
    mesa_notas: table?.notas ?? null,
    tablemates,
    bus_nombre: bus?.nombre ?? null,
    bus_paradas: bus?.paradas ?? [],
    bus_horarios: bus?.horarios ?? null,
    codigo_invitacion: guest.codigo_invitacion
  };
}

type DemoGuestInput = Omit<
  Guest,
  | "id"
  | "mesa_nombre"
  | "rsvp_token"
  | "codigo_invitacion"
  | "created_at"
  | "updated_at"
  | "comentarios"
  | "rsvp_first_view_at"
  | "rsvp_last_view_at"
  | "rsvp_view_count"
  | "rsvp_first_submitted_at"
  | "rsvp_last_submitted_at"
  | "rsvp_submit_count"
  | "rsvp_last_locale"
> & {
  id?: string;
  comentarios?: string | null;
};

type DemoTableInput = Omit<WeddingTable, "id">;
type DemoBusInput = Omit<WeddingBus, "id">;
type DemoSupplierInput = Omit<Supplier, "created_at" | "updated_at"> & {
  id?: string;
};
type DemoDocumentInput = Omit<DemoDocument, "created_at" | "updated_at" | "download_url" | "content_base64" | "proveedor_nombre"> & {
  id?: string;
  content_base64: string;
};

export async function createDemoGuest(values: DemoGuestInput) {
  const id = values.id ?? randomUUID();

  await updateDemoState((state) => {
    const codigo_invitacion = generateInvitationCode(state.guests.map((guest) => guest.codigo_invitacion));

    state.guests.unshift({
      ...values,
      comentarios: values.comentarios ?? null,
      ...trackingDefaults,
      id,
      rsvp_token: `demo-${randomUUID()}`,
      codigo_invitacion,
      created_at: now(),
      updated_at: now()
    });
  });

  return id;
}

export async function createDemoGuests(values: DemoGuestInput[]) {
  const createdIds: string[] = [];

  await updateDemoState((state) => {
    const usedCodes = new Set(state.guests.map((guest) => guest.codigo_invitacion));
    const createdAt = now();

    for (const value of [...values].reverse()) {
      const codigo_invitacion = generateInvitationCode(usedCodes);
      usedCodes.add(codigo_invitacion);
      const id = value.id ?? randomUUID();

      createdIds.unshift(id);

      state.guests.unshift({
        ...value,
        comentarios: value.comentarios ?? null,
        ...trackingDefaults,
        id,
        rsvp_token: `demo-${randomUUID()}`,
        codigo_invitacion,
        created_at: createdAt,
        updated_at: createdAt
      });
    }
  });

  return createdIds;
}

export async function updateDemoGuest(id: string, values: Partial<Guest>) {
  await updateDemoState((state) => {
    const guest = state.guests.find((item) => item.id === id);
    if (!guest) {
      return;
    }

    Object.assign(guest, values, { updated_at: now() });
  });
}

export async function deleteDemoGuest(id: string) {
  await updateDemoState((state) => {
    state.guests = state.guests.filter((guest) => guest.id !== id);
    state.busAssignments = state.busAssignments.filter((assignment) => assignment.invitado_id !== id);
  });
}

export async function getDemoGuestById(id: string) {
  const state = await loadDemoState();
  const aliasId = state.legacyGuestIdAliases?.[id] ?? demoGuestLegacyIdAliases[id];
  const guest = state.guests.find((item) => item.id === id || item.id === aliasId) ?? (state.guests.length > 0 ? state.guests[0] : null);

  if (!guest) {
    return null;
  }

  return {
    ...guest,
    mesa_nombre: state.tables.find((table) => table.id === guest.mesa_id)?.nombre ?? null
  };
}

export async function createDemoTable(values: DemoTableInput) {
  await updateDemoState((state) => {
    state.tables.unshift({
      ...values,
      id: randomUUID()
    });
  });
}

export async function updateDemoTable(id: string, values: Partial<WeddingTable>) {
  await updateDemoState((state) => {
    const table = state.tables.find((item) => item.id === id);
    if (!table) {
      return;
    }

    Object.assign(table, values);
  });
}

export async function deleteDemoTable(id: string) {
  await updateDemoState((state) => {
    state.tables = state.tables.filter((table) => table.id !== id);
    state.guests = state.guests.map((guest) =>
      guest.mesa_id === id
        ? {
            ...guest,
            mesa_id: null,
            updated_at: now()
          }
        : guest
    );
  });
}

export async function moveDemoGuestToTable(guestId: string, mesaId: string | null) {
  await updateDemoState((state) => {
    const guest = state.guests.find((item) => item.id === guestId);
    if (!guest) {
      return;
    }

    guest.mesa_id = mesaId;
    guest.updated_at = now();
  });
}

export async function createDemoBus(values: DemoBusInput) {
  await updateDemoState((state) => {
    state.buses.unshift({
      ...values,
      id: randomUUID()
    });
  });
}

export async function updateDemoBus(id: string, values: Partial<WeddingBus>) {
  await updateDemoState((state) => {
    const bus = state.buses.find((item) => item.id === id);
    if (!bus) {
      return;
    }

    Object.assign(bus, values);
  });
}

export async function deleteDemoBus(id: string) {
  await updateDemoState((state) => {
    state.buses = state.buses.filter((bus) => bus.id !== id);
    state.busAssignments = state.busAssignments.filter((assignment) => assignment.autobus_id !== id);
  });
}

export async function moveDemoGuestToBus(guestId: string, autobusId: string | null) {
  await updateDemoState((state) => {
    state.busAssignments = state.busAssignments.filter((assignment) => assignment.invitado_id !== guestId);

    if (!autobusId) {
      return;
    }

    state.busAssignments.push({
      autobus_id: autobusId,
      invitado_id: guestId
    });
  });
}

export async function createDemoSupplier(values: DemoSupplierInput) {
  await updateDemoState((state) => {
    const id = values.id ?? randomUUID();
    state.suppliers.unshift({
      ...values,
      id,
      created_at: now(),
      updated_at: now()
    });
  });
}

export async function updateDemoSupplier(id: string, values: Partial<Supplier>) {
  await updateDemoState((state) => {
    const supplier = state.suppliers.find((item) => item.id === id);
    if (!supplier) {
      return;
    }

    Object.assign(supplier, values, { updated_at: now() });
  });
}

export async function deleteDemoSupplier(id: string) {
  await updateDemoState((state) => {
    state.suppliers = state.suppliers.filter((supplier) => supplier.id !== id);
    state.documents = state.documents.map((document) =>
      document.proveedor_id === id
        ? {
            ...document,
            proveedor_id: null,
            updated_at: now()
          }
        : document
    );
  });
}

export async function createDemoDocument(values: DemoDocumentInput) {
  await updateDemoState((state) => {
    state.documents.unshift({
      ...values,
      id: values.id ?? randomUUID(),
      created_at: now(),
      updated_at: now()
    });
  });
}

export async function updateDemoDocument(id: string, values: Partial<WeddingDocument>) {
  await updateDemoState((state) => {
    const document = state.documents.find((item) => item.id === id);
    if (!document) {
      return;
    }

    Object.assign(document, values, { updated_at: now() });
  });
}

export async function deleteDemoDocument(id: string) {
  await updateDemoState((state) => {
    state.documents = state.documents.filter((document) => document.id !== id);
  });
}

export async function createDemoAuditEvent(values: Omit<AuditEvent, "id" | "created_at"> & { created_at?: string }) {
  await updateDemoState((state) => {
    state.auditEvents.unshift({
      ...buildAuditEventInput(values),
      id: randomUUID()
    });
  });
}

export async function trackDemoRsvpView(token: string, locale?: string | null) {
  await updateDemoState((state) => {
    const guest = findDemoGuestByAccessKey(state, token);
    if (!guest) {
      return;
    }

    guest.rsvp_view_count += 1;
    guest.rsvp_first_view_at ??= now();
    guest.rsvp_last_view_at = now();
    guest.rsvp_last_locale = locale ?? guest.rsvp_last_locale;
    guest.updated_at = now();
  });
}

export async function createDemoTask(values: Omit<PlannerTask, "id" | "created_at" | "updated_at">) {
  await updateDemoState((state) => {
    state.tasks.unshift({
      ...values,
      id: randomUUID(),
      created_at: now(),
      updated_at: now()
    });
  });
}

export async function updateDemoTask(id: string, values: Partial<PlannerTask>) {
  await updateDemoState((state) => {
    const task = state.tasks.find((item) => item.id === id);
    if (!task) {
      return;
    }

    Object.assign(task, values, { updated_at: now() });
  });
}

export async function deleteDemoTask(id: string) {
  await updateDemoState((state) => {
    state.tasks = state.tasks.filter((task) => task.id !== id);
  });
}

export async function createDemoBudgetItem(values: Omit<BudgetItem, "id" | "created_at" | "updated_at">) {
  await updateDemoState((state) => {
    state.budgetItems.unshift({
      ...values,
      id: randomUUID(),
      created_at: now(),
      updated_at: now()
    });
  });
}

export async function updateDemoBudgetItem(id: string, values: Partial<BudgetItem>) {
  await updateDemoState((state) => {
    const item = state.budgetItems.find((entry) => entry.id === id);
    if (!item) {
      return;
    }

    Object.assign(item, values, { updated_at: now() });
  });
}

export async function deleteDemoBudgetItem(id: string) {
  await updateDemoState((state) => {
    state.budgetItems = state.budgetItems.filter((item) => item.id !== id);
  });
}

export async function updateDemoRsvp(
  token: string,
  values: Pick<RsvpGuest, "confirmacion_asistencia" | "menu_elegido" | "alergias_intolerancias" | "necesita_autobus" | "hotel_alojamiento" | "comentarios">
) {
  await updateDemoState((state) => {
    const guest = findDemoGuestByAccessKey(state, token);
    if (!guest) {
      return;
    }

    Object.assign(guest, values, { updated_at: now() });
    guest.rsvp_submit_count += 1;
    guest.rsvp_first_submitted_at ??= now();
    guest.rsvp_last_submitted_at = now();
  });
}

export async function getDemoSettings(): Promise<WeddingSettings> {
  const state = await loadDemoState();
  return (
    state.settings ?? {
      iban: "ES00 0000 0000 0000 0000 0000",
      ibanHolder: "",
      ibanConcept: "",
      contactPhone: "",
      contactEmail: "",
      hotelSuggestions: ""
    }
  );
}

export async function updateDemoSettings(partial: Partial<WeddingSettings>): Promise<WeddingSettings> {
  let result: WeddingSettings | null = null;
  await updateDemoState((state) => {
    const current = state.settings ?? {
      iban: "ES00 0000 0000 0000 0000 0000",
      ibanHolder: "",
      ibanConcept: "",
      contactPhone: "",
      contactEmail: "",
      hotelSuggestions: ""
    };
    state.settings = { ...current, ...partial };
    result = state.settings;
  });
  return result!;
}

export type { WeddingSettings };
