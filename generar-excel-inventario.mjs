// Crea/actualiza el Excel de inventario en la carpeta del negocio.
// Conserva las cantidades que ya tengas y agrega los productos nuevos.
import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";
import { productos } from "./server/data/seed.js";

const CARPETAS = "C:/Users/omarc/Downloads/fotos-garaje-de-rochi";
const EXCEL = path.join(CARPETAS, "Inventario El Garaje de Rochi.xlsx");

// 1) Cantidades actuales: primero del Excel si existe; si no, de los cantidad.txt.
const actuales = {};
if (fs.existsSync(EXCEL)) {
  const wb = XLSX.readFile(EXCEL);
  const filas = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  for (const f of filas) {
    const sku = f["Código"] || f["Codigo"] || f["SKU"];
    const cant = Number(f["Cantidad"]);
    if (sku && !Number.isNaN(cant)) actuales[sku] = Math.max(0, Math.round(cant));
  }
} else {
  for (const c of fs.readdirSync(CARPETAS)) {
    const full = path.join(CARPETAS, c);
    if (!fs.statSync(full).isDirectory()) continue;
    const sku = (c.trim().match(/\(([A-Z0-9-]+)\)$/) || [])[1];
    if (!sku) continue;
    try { const m = fs.readFileSync(path.join(full, "cantidad.txt"), "utf-8").match(/\d+/); if (m) actuales[sku] = parseInt(m[0]); } catch {}
  }
}

// 2) Construir las filas (todos los productos del catálogo).
const money = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
const filas = productos.map((p, i) => ({
  "#": i + 1,
  "Producto": p.nombre,
  "Precio": money(p.precio),
  "Cantidad": actuales[p.sku] ?? 0,
  "Código": p.sku,
}));

// 3) Escribir el Excel.
const ws = XLSX.utils.json_to_sheet(filas, { header: ["#", "Producto", "Precio", "Cantidad", "Código"] });
ws["!cols"] = [{ wch: 4 }, { wch: 58 }, { wch: 14 }, { wch: 11 }, { wch: 18 }];
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Inventario");
XLSX.writeFile(wb, EXCEL);
console.log("Excel creado/actualizado:", EXCEL);
console.log("Productos:", filas.length);
