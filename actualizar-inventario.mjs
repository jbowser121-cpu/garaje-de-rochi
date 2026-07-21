// Actualiza el inventario de la tienda leyendo la cantidad.txt de cada carpeta
// de producto en Descargas, y publica los cambios en la página (Vercel).
// Se ejecuta solo al prender el computador (ver Actualizar-inventario.bat).
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PROYECTO = path.dirname(fileURLToPath(import.meta.url));
const CARPETAS = path.join(path.dirname(PROYECTO), "fotos-garaje-de-rochi");
const INVENTARIO = path.join(PROYECTO, "server", "data", "inventario.js");
const LOG = path.join(CARPETAS, "_ultima-actualizacion.txt");

const log = (msg) => {
  const linea = `[${new Date().toLocaleString("es-CO")}] ${msg}`;
  console.log(linea);
  try { fs.appendFileSync(LOG, linea + "\n", "utf-8"); } catch {}
};

function leerCantidad(archivo) {
  try {
    const m = fs.readFileSync(archivo, "utf-8").match(/\d+/); // primer número
    return m ? Math.max(0, parseInt(m[0], 10)) : null;
  } catch { return null; }
}

if (!fs.existsSync(CARPETAS)) {
  log("No se encontró la carpeta de productos. Nada que hacer.");
  process.exit(0);
}

const inventario = {};
const agotados = [];
for (const carpeta of fs.readdirSync(CARPETAS)) {
  const full = path.join(CARPETAS, carpeta);
  if (!fs.statSync(full).isDirectory()) continue;
  const sku = (carpeta.trim().match(/\(([A-Z0-9-]+)\)$/) || [])[1];
  if (!sku) continue;
  const cant = leerCantidad(path.join(full, "cantidad.txt"));
  if (cant === null) continue;
  inventario[sku] = cant;
  if (cant === 0) agotados.push(sku);
}

let out = "// Inventario de El Garaje de Rochi. Se actualiza SOLO al prender el computador\n";
out += "// (lee la cantidad.txt de cada carpeta en Descargas/fotos-garaje-de-rochi).\n";
out += "// No lo edites a mano: cambia los números en las carpetas.\n\n";
out += "export const inventario = {\n";
for (const [sku, cant] of Object.entries(inventario)) out += `  "${sku}": ${cant},\n`;
out += "};\n";
fs.writeFileSync(INVENTARIO, out, "utf-8");

log(`Inventario leído (${Object.keys(inventario).length} productos). Agotados: ${agotados.length ? agotados.join(", ") : "ninguno"}.`);

// Publicar en la página (Vercel) si hubo cambios.
try {
  execSync("git add server/data/inventario.js", { cwd: PROYECTO, stdio: "ignore" });
  const cambios = execSync("git status --porcelain server/data/inventario.js", { cwd: PROYECTO }).toString().trim();
  if (!cambios) { log("Sin cambios en el inventario. No se publica."); process.exit(0); }
  execSync('git commit -q -m "Actualizar inventario"', { cwd: PROYECTO, stdio: "ignore" });
  execSync("git push", { cwd: PROYECTO, stdio: "ignore" });
  log("Inventario publicado en la pagina. Se vera en ~1 minuto.");
} catch (e) {
  log("No se pudo publicar (sin internet?). Se intentara la proxima vez. Detalle: " + e.message);
}
