/**
 * ════════════════════════════════════════════════════════════════════════
 *  DATOS DE LA BODA
 *
 *  Este es el archivo que hay que editar para que la web hable de vosotros:
 *  nombres, fecha, lugar, horario, transporte y textos. El resto de la app
 *  (web de invitados, panel, correos, QR, imágenes para redes) lee de aquí.
 *
 *  Los datos privados (IBAN, teléfono, email de contacto) NO van aquí:
 *  van en las variables de entorno (.env.local / Vercel). Ver .env.example.
 * ════════════════════════════════════════════════════════════════════════
 */

/** Idiomas que existen en el código. */
export type WeddingLocale = "es" | "ca";

/**
 * Idiomas que se publican, en orden (el primero es el principal).
 * Si solo queréis castellano, dejad `["es"]`: desaparece el selector de idioma
 * y no se generan las páginas en catalán.
 */
export const idiomas: readonly WeddingLocale[] = ["es", "ca"];

// ─── La pareja ───────────────────────────────────────────────────────────

export const pareja = {
  uno: "Alex",
  dos: "Sam"
} as const;

/** "Alex & Sam": cabeceras, título de la web, correos, QR. */
export const nombresPareja = `${pareja.uno} & ${pareja.dos}`;

/** "Alex y Sam" / "Alex i Sam": para frases. */
export const nombresParejaEnFrase: Record<WeddingLocale, string> = {
  es: `${pareja.uno} y ${pareja.dos}`,
  ca: `${pareja.uno} i ${pareja.dos}`
};

/** Iniciales para el favicon, la pantalla de carga y similares. */
export const iniciales = `${pareja.uno.charAt(0)}&${pareja.dos.charAt(0)}`;

// ─── Fecha y lugar ───────────────────────────────────────────────────────

export const evento = {
  /** Hora de inicio (la de la ceremonia), con zona horaria. */
  inicioIso: "2027-09-18T17:00:00+02:00",
  /** Fin aproximado de la fiesta (para el calendario). */
  finIso: "2027-09-19T02:00:00+02:00",
  /** Último día para confirmar asistencia. */
  rsvpLimiteIso: "2027-07-31T23:59:59+02:00",
  /** Zona horaria en la que se muestran las fechas. */
  zonaHoraria: "Europe/Madrid",
  lugar: {
    nombre: "Finca de ejemplo",
    ciudad: "Tu ciudad",
    /** Dirección que se busca en Google Maps / Apple Maps / Waze. */
    direccionMapa: "Puerta del Sol, Madrid",
    /** Código de país para los datos estructurados de buscadores. */
    pais: "ES"
  }
} as const;

/** Horario del día (texto libre, formato HH:MM). */
export const horario = {
  llegada: "16:30",
  ceremonia: "17:00",
  coctel: "18:00",
  cena: "20:00",
  fiesta: "22:30"
} as const;

/**
 * Autobús para invitados. Si no vais a poner autobús, `activo: false`
 * esconde el bloque de transporte y la pregunta del RSVP.
 */
export const autobus = {
  activo: true,
  salida: "15:30",
  regresos: ["00:00", "02:00"]
} as const;

// ─── Textos por idioma ───────────────────────────────────────────────────

type TextosIdioma = {
  /** Frase corta encima de los nombres. */
  antetitulo: string;
  /** Párrafo de bienvenida de la portada. */
  bienvenida: string;
  /** Descripción para Google y al compartir el enlace. */
  descripcionSeo: string;
  lugarDescripcion: string;
  transporteTitulo: string;
  transporteTexto: string;
  paradaAutobus: string;
  paradaAutobusDetalle: string;
  vestimenta: string;
  notaRsvp: string;
  /** Firma de los correos y mensajes. */
  firma: string;
};

export const textos: Record<WeddingLocale, TextosIdioma> = {
  es: {
    antetitulo: "Nos casamos",
    bienvenida:
      "Queremos celebrarlo con vosotros. Aquí tenéis la información del día y el acceso para confirmar asistencia.",
    descripcionSeo: `Boda de ${nombresParejaEnFrase.es}. Información del día y confirmación de asistencia.`,
    lugarDescripcion: "Describe aquí el lugar en una o dos frases.",
    transporteTitulo: "Autobús para invitados",
    transporteTexto: `Salida a las ${autobus.salida} desde el punto de recogida. Regresos a las ${autobus.regresos.join(" y ")}.`,
    paradaAutobus: "Punto de recogida (calle y número)",
    paradaAutobusDetalle: "El autobús vuelve al mismo punto.",
    vestimenta: "Formal",
    notaRsvp: "Guarda tu enlace personal: sirve para responder y para cambiar la respuesta.",
    firma: `Un abrazo, ${nombresParejaEnFrase.es}`
  },
  ca: {
    antetitulo: "Ens casem",
    bienvenida:
      "Volem celebrar-ho amb vosaltres. Aquí teniu la informació del dia i l'accés per confirmar assistència.",
    descripcionSeo: `Casament de ${nombresParejaEnFrase.ca}. Informació del dia i confirmació d'assistència.`,
    lugarDescripcion: "Descriu aquí el lloc en una o dues frases.",
    transporteTitulo: "Autobús per als convidats",
    transporteTexto: `Sortida a les ${autobus.salida} des del punt de recollida. Tornades a les ${autobus.regresos.join(" i ")}.`,
    paradaAutobus: "Punt de recollida (carrer i número)",
    paradaAutobusDetalle: "L'autobús torna al mateix punt.",
    vestimenta: "Formal",
    notaRsvp: "Guarda el teu enllaç personal: serveix per respondre i per canviar la resposta.",
    firma: `Una abraçada, ${nombresParejaEnFrase.ca}`
  }
};

/** Programa del día que sale en /agenda y en la portada. */
export const programa: Record<WeddingLocale, Array<{ hora: string; titulo: string; texto: string }>> = {
  es: [
    { hora: horario.llegada, titulo: "Llegada", texto: "Recepción de invitados." },
    { hora: horario.ceremonia, titulo: "Ceremonia", texto: "" },
    { hora: horario.coctel, titulo: "Cóctel", texto: "" },
    { hora: horario.cena, titulo: "Cena", texto: "" },
    { hora: horario.fiesta, titulo: "Fiesta", texto: "" }
  ],
  ca: [
    { hora: horario.llegada, titulo: "Arribada", texto: "Recepció de convidats." },
    { hora: horario.ceremonia, titulo: "Cerimònia", texto: "" },
    { hora: horario.coctel, titulo: "Còctel", texto: "" },
    { hora: horario.cena, titulo: "Sopar", texto: "" },
    { hora: horario.fiesta, titulo: "Festa", texto: "" }
  ]
};

/** Preguntas frecuentes de /informacion. Añade o quita las que quieras. */
export const preguntas: Record<WeddingLocale, Array<{ pregunta: string; respuesta: string }>> = {
  es: [
    {
      pregunta: "¿Cómo confirmo mi asistencia?",
      respuesta: "Con el enlace personal o el código que aparece en tu invitación."
    },
    {
      pregunta: "¿Puedo cambiar mi respuesta?",
      respuesta: "Sí. Vuelve a abrir el mismo enlace y guarda los cambios."
    },
    {
      pregunta: "¿Dónde indico alergias o intolerancias?",
      respuesta: "En el formulario de confirmación hay un campo para ello."
    }
  ],
  ca: [
    {
      pregunta: "Com confirmo la meva assistència?",
      respuesta: "Amb l'enllaç personal o el codi que apareix a la teva invitació."
    },
    {
      pregunta: "Puc canviar la meva resposta?",
      respuesta: "Sí. Torna a obrir el mateix enllaç i desa els canvis."
    },
    {
      pregunta: "On indico al·lèrgies o intoleràncies?",
      respuesta: "Al formulari de confirmació hi ha un camp per a això."
    }
  ]
};

// ─── Panel privado ───────────────────────────────────────────────────────

/**
 * Quién se encarga de cada tarea. La base de datos guarda la clave
 * (uno / dos / ambos); aquí decides cómo se muestra.
 */
export const responsables = {
  uno: pareja.uno,
  dos: pareja.dos,
  ambos: "Ambos"
} as const;

export type Responsable = keyof typeof responsables;

export const RESPONSABLES = Object.keys(responsables) as Responsable[];

/** Nombre a mostrar para la clave guardada en la base de datos. */
export function etiquetaResponsable(valor: string) {
  return (responsables as Record<string, string>)[valor] ?? valor;
}

/**
 * A quién avisar si el acceso al panel falla (aparece en los mensajes de
 * error del login). Suele ser quien ha montado la web.
 */
export const contactoTecnico = pareja.uno;
