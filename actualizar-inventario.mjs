// Actualiza el inventario de la tienda leyendo el Excel de inventario
// (Inventario El Garaje de Rochi.xlsx) y publica los cambios en la página (Vercel).
// Se ejecuta al prender el computador o con doble clic en el acceso directo.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const PROYECTO = path.dirname(fileURLToPath(import.meta.url));
const CARPETAS = path.join(path.dirname(PROYECTO), "fotos-garaje-de-rochi");
const EXCEL = path.join(CARPETAS, "Inventario El Garaje de Rochi.xlsx");
const INVENTARIO = path.join(PROYECTO, "server", "data", "inventario.js");
const LOG = path.join(CARPETAS, "_ultima-actualizacion.txt");

const log = (msg) => {
  const linea = `[${new Date().toLocaleString("es-CO")}] ${msg}`;
  console.log(linea);
  try { fs.appendFileSync(LOG, linea + "\n", "utf-8"); } catch {}
};

const inventario = {};
const agotados = [];

if (fs.existsSync(EXCEL)) {
  // Leer del Excel (columna Cantidad, identificada por Código/SKU).
  let filas;
  try {
    const wb = XLSX.readFile(EXCEL);
    filas = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  } catch {
    log("⚠️ No se pudo leer el Excel (¿lo tienes abierto?). Ciérralo y vuelve a ejecutar.");
    process.exit(0);
  }
  for (const f of filas) {
    const sku = f["Código"] || f["Codigo"] || f["SKU"];
    const cant = Number(f["Cantidad"]);
    if (!sku || Number.isNaN(cant)) continue;
    inventario[sku] = Math.max(0, Math.round(cant));
    if (inventario[sku] === 0) agotados.push(sku);
  }
} else {
  // Respaldo: leer la cantidad.txt de cada carpeta.
  if (!fs.existsSync(CARPETAS)) { log("No se encontró la carpeta de productos."); process.exit(0); }
  for (const carpeta of fs.readdirSync(CARPETAS)) {
    const full = path.join(CARPETAS, carpeta);
    if (!fs.statSync(full).isDirectory()) continue;
    const sku = (carpeta.trim().match(/\(([A-Z0-9-]+)\)$/) || [])[1];
    if (!sku) continue;
    try {
      const m = fs.readFileSync(path.join(full, "cantidad.txt"), "utf-8").match(/\d+/);
      if (m) { inventario[sku] = Math.max(0, parseInt(m[0], 10)); if (inventario[sku] === 0) agotados.push(sku); }
    } catch {}
  }
}

if (Object.keys(inventario).length === 0) { log("No se leyó ninguna cantidad. Nada que publicar."); process.exit(0); }

let out = "// Inventario de El Garaje de Rochi. Se genera automáticamente desde el Excel.\n";
out += "// No lo edites a mano: cambia las cantidades en 'Inventario El Garaje de Rochi.xlsx'.\n\n";
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
  log("✅ Inventario publicado en la página. Se verá en ~1 minuto.");
} catch (e) {
  log("No se pudo publicar (¿sin internet?). Se intentará la próxima vez. Detalle: " + e.message);
}
