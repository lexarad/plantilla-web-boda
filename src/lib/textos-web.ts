// Textos fijos de la web de invitados (menú, botones, títulos de página).
// Los datos de la boda (nombres, fecha, lugar...) viven en src/config/boda.ts.
import type { WeddingLocale } from "@/config/boda";

export type SeccionPublica = "inicio" | "agenda" | "informacion" | "mapa" | "regalo" | "rsvp";

/** Rutas de la web de invitados, sin el prefijo de idioma. */
export const rutasPublicas: Record<SeccionPublica, string> = {
  inicio: "",
  agenda: "/agenda",
  informacion: "/informacion",
  mapa: "/mapa",
  regalo: "/regalo",
  rsvp: "/rsvp"
};

/** Orden del menú (rsvp va aparte, como botón). */
export const menuPublico: SeccionPublica[] = ["inicio", "agenda", "informacion", "mapa", "regalo"];

export function rutaPublica(locale: WeddingLocale, seccion: SeccionPublica) {
  return `/${locale}${rutasPublicas[seccion]}`;
}

type TextosWeb = {
  menu: Record<SeccionPublica, string>;
  abrirMenu: string;
  idioma: string;
  saltarContenido: string;
  inicio: {
    confirmar: string;
    verPrograma: string;
    loEsencial: string;
    fecha: string;
    lugar: string;
    hora: string;
    transporte: string;
    vestimenta: string;
    confirmarAntes: string;
    faltan: (dias: number) => string;
    hoy: string;
    masInfo: string;
    preparacion: string;
  };
  agenda: { titulo: string; intro: string };
  informacion: {
    titulo: string;
    intro: string;
    preguntas: string;
    alojamiento: string;
    contacto: string;
    telefono: string;
    email: string;
  };
  mapa: {
    titulo: string;
    abrirEn: string;
    mapaDe: (lugar: string) => string;
    parada: string;
    salida: string;
    regresos: string;
  };
  regalo: {
    titulo: string;
    intro: string;
    cuenta: string;
    titular: string;
    concepto: string;
    copiar: string;
    copiado: string;
    errorCopiar: string;
    errorCopiarDetalle: string;
    sinIban: string;
  };
  calendario: string;
  pie: string;
};

export const textosWeb: Record<WeddingLocale, TextosWeb> = {
  es: {
    menu: {
      inicio: "Inicio",
      agenda: "Programa",
      informacion: "Información",
      mapa: "Cómo llegar",
      regalo: "Regalo",
      rsvp: "Confirmar asistencia"
    },
    abrirMenu: "Menú",
    idioma: "Idioma",
    saltarContenido: "Saltar al contenido",
    inicio: {
      confirmar: "Confirmar asistencia",
      verPrograma: "Ver el programa",
      loEsencial: "Lo esencial",
      fecha: "Fecha",
      lugar: "Lugar",
      hora: "Hora",
      transporte: "Transporte",
      vestimenta: "Vestimenta",
      confirmarAntes: "Confirmar antes del",
      faltan: (dias) => (dias === 1 ? "Falta 1 día" : `Faltan ${dias} días`),
      hoy: "¡Es hoy!",
      masInfo: "Más información",
      preparacion: "La web todavía está en preparación. Pronto podrás confirmar tu asistencia desde aquí."
    },
    agenda: { titulo: "Programa", intro: "Horario aproximado del día." },
    informacion: {
      titulo: "Información",
      intro: "Lo práctico para el día.",
      preguntas: "Preguntas frecuentes",
      alojamiento: "Alojamiento",
      contacto: "Contacto",
      telefono: "Teléfono",
      email: "Email"
    },
    mapa: {
      titulo: "Cómo llegar",
      abrirEn: "Abrir en",
      mapaDe: (lugar) => `Mapa de ${lugar}`,
      parada: "Punto de recogida",
      salida: "Salida",
      regresos: "Regresos"
    },
    regalo: {
      titulo: "Regalo",
      intro: "Lo importante es que vengas. Si quieres hacernos un regalo, aquí tienes los datos.",
      cuenta: "Número de cuenta",
      titular: "Titular",
      concepto: "Concepto",
      copiar: "Copiar IBAN",
      copiado: "Copiado",
      errorCopiar: "No se pudo copiar",
      errorCopiarDetalle: "Cópialo a mano, por favor.",
      sinIban: "Los datos de la cuenta todavía no están publicados."
    },
    calendario: "Añadir al calendario",
    pie: "Web de boda"
  },
  ca: {
    menu: {
      inicio: "Inici",
      agenda: "Programa",
      informacion: "Informació",
      mapa: "Com arribar",
      regalo: "Regal",
      rsvp: "Confirmar assistència"
    },
    abrirMenu: "Menú",
    idioma: "Idioma",
    saltarContenido: "Saltar al contingut",
    inicio: {
      confirmar: "Confirmar assistència",
      verPrograma: "Veure el programa",
      loEsencial: "L'essencial",
      fecha: "Data",
      lugar: "Lloc",
      hora: "Hora",
      transporte: "Transport",
      vestimenta: "Vestimenta",
      confirmarAntes: "Confirmar abans del",
      faltan: (dias) => (dias === 1 ? "Falta 1 dia" : `Falten ${dias} dies`),
      hoy: "És avui!",
      masInfo: "Més informació",
      preparacion: "La web encara està en preparació. Aviat podràs confirmar la teva assistència des d'aquí."
    },
    agenda: { titulo: "Programa", intro: "Horari aproximat del dia." },
    informacion: {
      titulo: "Informació",
      intro: "El més pràctic per al dia.",
      preguntas: "Preguntes freqüents",
      alojamiento: "Allotjament",
      contacto: "Contacte",
      telefono: "Telèfon",
      email: "Email"
    },
    mapa: {
      titulo: "Com arribar",
      abrirEn: "Obrir a",
      mapaDe: (lugar) => `Mapa de ${lugar}`,
      parada: "Punt de recollida",
      salida: "Sortida",
      regresos: "Tornades"
    },
    regalo: {
      titulo: "Regal",
      intro: "El més important és que vinguis. Si ens vols fer un regal, aquí tens les dades.",
      cuenta: "Número de compte",
      titular: "Titular",
      concepto: "Concepte",
      copiar: "Copiar IBAN",
      copiado: "Copiat",
      errorCopiar: "No s'ha pogut copiar",
      errorCopiarDetalle: "Copia'l a mà, si us plau.",
      sinIban: "Les dades del compte encara no estan publicades."
    },
    calendario: "Afegir al calendari",
    pie: "Web de casament"
  }
};
