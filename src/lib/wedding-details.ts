// Datos del día ya listos para pintar, en el idioma pedido. Todo sale de
// src/config/boda.ts: aquí solo se formatean fechas y se juntan piezas.
import { autobus, evento, horario, textos, type WeddingLocale } from "@/config/boda";

export type { WeddingLocale };

type Details = {
  eventDateTimeIso: string;
  eventEndIso: string;
  dateLabel: string;
  dateShort: string;
  arrivalTime: string;
  ceremonyTime: string;
  cocktailTime: string;
  dinnerTime: string;
  partyTime: string;
  venueName: string;
  venueLocation: string;
  venueLabel: string;
  venueCopy: string;
  venueMapQuery: string;
  busEnabled: boolean;
  busStopLabel: string;
  busStopDetail: string;
  busDeparture: string;
  busReturns: string[];
  transportLabel: string;
  transportCopy: string;
  dressCode: string;
  rsvpDeadline: string;
  rsvpNote: string;
};

const intlLocale: Record<WeddingLocale, string> = { es: "es-ES", ca: "ca-ES" };

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** "Sábado, 18 de septiembre de 2027" */
export function formatLongDate(iso: string, locale: WeddingLocale) {
  return capitalize(
    new Intl.DateTimeFormat(intlLocale[locale], {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: evento.zonaHoraria
    }).format(new Date(iso))
  );
}

/** "18 de septiembre de 2027" */
export function formatDate(iso: string, locale: WeddingLocale) {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: evento.zonaHoraria
  }).format(new Date(iso));
}

/** "18/09/2027" */
export function formatNumericDate(iso: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: evento.zonaHoraria
  }).format(new Date(iso));
}

function buildDetails(locale: WeddingLocale): Details {
  const t = textos[locale];

  return {
    eventDateTimeIso: evento.inicioIso,
    eventEndIso: evento.finIso,
    dateLabel: formatLongDate(evento.inicioIso, locale),
    dateShort: formatDate(evento.inicioIso, locale),
    arrivalTime: horario.llegada,
    ceremonyTime: horario.ceremonia,
    cocktailTime: horario.coctel,
    dinnerTime: horario.cena,
    partyTime: horario.fiesta,
    venueName: evento.lugar.nombre,
    venueLocation: evento.lugar.ciudad,
    venueLabel: evento.lugar.nombre,
    venueCopy: t.lugarDescripcion,
    venueMapQuery: evento.lugar.direccionMapa,
    busEnabled: autobus.activo,
    busStopLabel: t.paradaAutobus,
    busStopDetail: t.paradaAutobusDetalle,
    busDeparture: autobus.salida,
    busReturns: [...autobus.regresos],
    transportLabel: t.transporteTitulo,
    transportCopy: t.transporteTexto,
    dressCode: t.vestimenta,
    rsvpDeadline: formatDate(evento.rsvpLimiteIso, locale),
    rsvpNote: t.notaRsvp
  };
}

export const weddingDetailsByLocale: Record<WeddingLocale, Details> = {
  es: buildDetails("es"),
  ca: buildDetails("ca")
};

export function getWeddingDetails(locale: WeddingLocale = "es") {
  return weddingDetailsByLocale[locale];
}
