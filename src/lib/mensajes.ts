// Rellena los huecos {nombre}, {enlace}, {pareja}, {fecha}, {lugar}… de los
// mensajes de src/config/boda.ts. Los huecos sin valor se quedan vacíos.
import { nombresParejaEnFrase, textos } from "@/config/boda";
import { getWeddingDetails } from "@/lib/wedding-details";

export function rellenarMensaje(plantilla: string, valores: Record<string, string> = {}) {
  const d = getWeddingDetails("es");
  const todos: Record<string, string> = {
    pareja: nombresParejaEnFrase.es,
    fecha: d.dateShort,
    lugar: d.venueName,
    limite: d.rsvpDeadline,
    firma: textos.es.firma,
    ...valores
  };

  return plantilla.replace(/\{(\w+)\}/g, (_, clave: string) => todos[clave] ?? "");
}
