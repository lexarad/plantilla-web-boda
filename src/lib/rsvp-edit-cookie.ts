// Cookie que recuerda que el invitado ya confirmó su apellido para cambiar una
// respuesta enviada. Guarda el apellido normalizado (lo comprueba la base de
// datos en cada cambio). Vive fuera de las server actions porque un fichero
// "use server" solo puede exportar funciones asíncronas.
export function rsvpEditCookieName(token: string) {
  return `rsvp-edit-${token.slice(0, 12)}`;
}

/**
 * Compara apellidos ignorando mayúsculas, acentos y espacios de más. Igual que
 * la función SQL normalizar_apellido.
 */
export function normalizarApellido(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
