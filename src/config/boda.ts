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
 * Idiomas que se publican, en orden (el primero es el principal). Con un solo
 * idioma no aparece selector. Para publicar también en catalán: `["es", "ca"]`
 * (los textos en catalán ya están escritos en este archivo y en textos-web.ts).
 */
export const idiomas: readonly WeddingLocale[] = ["es"];

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
    antetitulo: "Te invitamos a nuestra boda",
    bienvenida:
      "Aquí tienes todo lo que necesitas para el día. Y, cuando lo tengas claro, dinos si vienes.",
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
    antetitulo: "Et convidem al nostre casament",
    bienvenida:
      "Aquí tens tot el que necessites per al dia. I, quan ho tinguis clar, digues-nos si vens.",
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

/** Programa del día que sale en /programa. */
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
      pregunta: "¿Hay aparcamiento?",
      respuesta: "Escribe aquí si hay parking en el lugar o dónde aparcar cerca."
    },
    {
      pregunta: "¿Pueden venir niños?",
      respuesta: "Explica aquí si los peques están invitados y si habrá menú o actividades para ellos."
    },
    {
      pregunta: "¿Hasta qué hora dura la fiesta?",
      respuesta: "Indica aquí la hora aproximada de cierre y cómo volver."
    }
  ],
  ca: [
    {
      pregunta: "Hi ha aparcament?",
      respuesta: "Escriu aquí si hi ha pàrquing al lloc o on aparcar a prop."
    },
    {
      pregunta: "Poden venir nens?",
      respuesta: "Explica aquí si els petits estan convidats i si hi haurà menú o activitats per a ells."
    },
    {
      pregunta: "Fins a quina hora dura la festa?",
      respuesta: "Indica aquí l'hora aproximada de tancament i com tornar."
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

// ─── Mensajes que se envían desde el panel ───────────────────────────────

/**
 * Textos de WhatsApp y correo. Huecos que se rellenan solos:
 *   {nombre} invitado · {enlace} su enlace personal · {pareja} · {fecha} · {lugar}
 * Escríbelos a vuestra manera: estos son solo un punto de partida.
 */
export const mensajes = {
  /** Botón de WhatsApp en la ficha y en la lista de invitados. */
  whatsappInvitacion:
    "¡Hola, {nombre}! Te invitamos a la boda de {pareja}: {fecha}, en {lugar}. Cuando puedas, cuéntanos si vienes desde aquí: {enlace}",
  /** Un único mensaje para todo un grupo (familia, pareja...). {enlace} es la lista de enlaces. */
  whatsappGrupo: "¡Hola, {nombre}! Estáis invitados a la boda de {pareja}. Cada uno tiene su enlace para responder:\n{enlace}",
  /** Recordatorio para quien aún no ha contestado. */
  whatsappRecordatorio: "{nombre}, ¿te llegó la invitación a la boda de {pareja}? Nos viene genial saber si vienes: {enlace}",
  /** Envíos masivos desde Invitados > Enviar invitaciones (se pueden editar en pantalla). */
  envios: {
    pendientes: {
      asunto: "{pareja} se casan el {fecha}",
      whatsapp: "¡Hola, {nombre}! Te invitamos a la boda de {pareja}: {fecha}, en {lugar}. Responde aquí: {enlace}",
      email:
        "Hola, {nombre}:\n\nNos casamos el {fecha} en {lugar} y nos encantaría que vinieras.\n\nPuedes responder (y cambiar la respuesta cuando quieras) en tu enlace:\n{enlace}\n\n{firma}"
    },
    sinAbrir: {
      asunto: "Tu invitación a la boda de {pareja}",
      whatsapp: "{nombre}, te reenviamos la invitación a la boda de {pareja} por si se perdió: {enlace}",
      email: "Hola, {nombre}:\n\nTe reenviamos la invitación a nuestra boda por si no te llegó:\n{enlace}\n\n{firma}"
    },
    abiertoSinResponder: {
      asunto: "¿Vienes a la boda de {pareja}?",
      whatsapp: "{nombre}, cuando tengas un momento, dinos si vienes a la boda: {enlace}",
      email:
        "Hola, {nombre}:\n\nAún nos falta tu respuesta. Con ella podemos cerrar mesas y menús:\n{enlace}\n\n{firma}"
    },
    confirmados: {
      asunto: "Detalles del día · {pareja}",
      whatsapp: "{nombre}, ¡gracias por confirmar! Aquí tienes toda la información del día: {enlace}",
      email: "Hola, {nombre}:\n\n¡Gracias por confirmar! Te recordamos lo principal:\n{detalles}\n\nTu enlace sigue activo:\n{enlace}\n\n{firma}"
    }
  },
  /** Correo de invitación individual (botón "Enviar por email" de la ficha). */
  correo: {
    asunto: "{pareja} se casan el {fecha}",
    saludo: "Hola, {nombre}:",
    texto: "Nos casamos y nos encantaría contar contigo. Puedes responder desde tu enlace personal:",
    boton: "Responder a la invitación",
    enlaceAlternativo: "Si el botón no funciona, abre esta dirección:",
    pie: "El enlace es solo tuyo y sirve también para cambiar la respuesta. Responde antes del {limite}."
  }
} as const;
