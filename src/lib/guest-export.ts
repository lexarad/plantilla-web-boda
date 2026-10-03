import type { Guest } from "@/lib/types";

export function buildGuestCsvRows(guests: Guest[]) {
  return guests.map((guest) => ({
    nombre: guest.nombre,
    apellidos: guest.apellidos,
    email: guest.email ?? "",
    telefono: guest.telefono ?? "",
    grupo: guest.grupo ?? "",
    confirmacion_asistencia: guest.confirmacion_asistencia,
    menu_elegido: guest.menu_elegido,
    mesa: guest.mesa_nombre ?? "",
    necesita_autobus: guest.necesita_autobus ? "si" : "no",
    hotel_alojamiento: guest.hotel_alojamiento ?? "",
    codigo_invitacion: guest.codigo_invitacion,
    rsvp_token: guest.rsvp_token,
    visitas_rsvp: String(guest.rsvp_view_count),
    respuestas_rsvp: String(guest.rsvp_submit_count),
    notas_internas: guest.notas_internas ?? "",
    comentarios: guest.comentarios ?? ""
  }));
}
