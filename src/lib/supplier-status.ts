/**
 * Un proveedor queda "no disponible" cuando su nota lo dice (lo escriben tanto el
 * volcado manual como cualquier importación automática). La detección vive AQUÍ y solo aquí:
 * proveedores, dashboard y cualquier otra vista deben usar este helper para no
 * contradecirse entre pantallas (case-insensitive a propósito: también lo escriben humanos).
 */
export function isSupplierUnavailable(notas: string | null | undefined): boolean {
  return (notas ?? "").toUpperCase().includes("NO DISPONIBLE");
}
