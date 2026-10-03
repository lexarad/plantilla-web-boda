// Nombre de la cookie que recuerda que el invitado ya confirmó su identidad
// para editar una respuesta enviada. Vive fuera de las server actions porque
// un fichero "use server" solo puede exportar funciones asíncronas.
export function rsvpEditCookieName(token: string) {
  return `rsvp-edit-${token.slice(0, 12)}`;
}
