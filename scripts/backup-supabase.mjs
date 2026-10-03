#!/usr/bin/env node
// Copia de seguridad de todos los datos de la boda.
//
// El plan gratuito de Supabase no hace copias automáticas: invitados, menús,
// alergias, mesas, presupuesto y proveedores viven en un único sitio y un
// borrado accidental (o un problema del proveedor) se los lleva. Este script
// vuelca todas las tablas a un JSON usando la Management API.
//
// Uso:  node scripts/backup-supabase.mjs [carpeta-destino]
// Necesita: SUPABASE_ACCESS_TOKEN y PROJECT_REF (en .env.local o en el entorno).

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const TABLAS = [
  "invitados",
  "mesas",
  "autobuses",
  "autobus_invitados",
  "tareas",
  "gastos",
  "proveedores",
  "documentos",
  "cronograma",
  "auditoria"
];

/** Lee .env.local si existe, para poder ejecutarlo también en local sin exportar nada. */
function cargarEnvLocal() {
  if (!existsSync(".env.local")) return;
  for (const linea of readFileSync(".env.local", "utf8").split("\n")) {
    const match = linea.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
}

async function consultar(ref, token, sql) {
  const respuesta = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Sin User-Agent, Cloudflare responde 403 (código 1010).
      "User-Agent": "boda-backup/1.0"
    },
    body: JSON.stringify({ query: sql })
  });

  if (!respuesta.ok) {
    throw new Error(`Consulta fallida (${respuesta.status}): ${(await respuesta.text()).slice(0, 300)}`);
  }

  return respuesta.json();
}

async function main() {
  cargarEnvLocal();
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const ref = process.env.PROJECT_REF;

  if (!token || !ref) {
    console.error("Faltan SUPABASE_ACCESS_TOKEN o PROJECT_REF.");
    process.exit(1);
  }

  const destino = process.argv[2] ?? "backups";
  mkdirSync(destino, { recursive: true });

  const copia = { generado: new Date().toISOString(), proyecto: ref, tablas: {} };
  let filas = 0;

  for (const tabla of TABLAS) {
    const datos = await consultar(ref, token, `select * from public.${tabla}`);
    copia.tablas[tabla] = datos;
    filas += Array.isArray(datos) ? datos.length : 0;
    console.log(`${tabla}: ${Array.isArray(datos) ? datos.length : "?"} filas`);
  }

  const fecha = copia.generado.slice(0, 10);
  const ruta = join(destino, `boda-${fecha}.json`);
  writeFileSync(ruta, JSON.stringify(copia, null, 2), "utf8");
  console.log(`\nCopia guardada en ${ruta} (${filas} filas en total).`);

  // Una copia con cero filas suele significar que algo ha ido mal (permisos,
  // proyecto equivocado), no que la boda no tenga invitados: mejor fallar.
  if (filas === 0) {
    console.error("La copia está vacía: falla para que se note.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
