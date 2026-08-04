// Lee inventario.xlsx, actualiza la tienda y la publica.
// Escribe TRES cosas para que el sistema viejo de carpetas nunca contradiga al Excel:
//   1. server/data/inventario.js  (cantidades — lo que ya leía la página)
//   2. server/data/ajustes.js     (precio y visibilidad — nuevo)
//   3. cantidad.txt de cada carpeta en Descargas/fotos-garaje-de-rochi
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { productos } from '../server/data/seed.js';

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const EXCEL = path.join(raiz, 'inventario.xlsx');
const INVENTARIO = path.join(raiz, 'server', 'data', 'inventario.js');
const AJUSTES = path.join(raiz, 'server', 'data', 'ajustes.js');
const CARPETAS = path.join(path.dirname(raiz), 'fotos-garaje-de-rochi');

const log = (...a) => console.log(...a);
const morir = (msg) => { log(`\n❌ ${msg}\n`); process.exit(1); };

if (!fs.existsSync(EXCEL)) morir(`No encontré:\n   ${EXCEL}\n\nDebe estar en la carpeta del proyecto y llamarse "inventario.xlsx".`);

log('\n📖 Leyendo el Excel…');
const libro = new ExcelJS.Workbook();
try {
  await libro.xlsx.readFile(EXCEL);
} catch (e) {
  morir(`No pude abrir el Excel. ¿Lo dejaste abierto?\nCiérralo y vuelve a intentar.\n\nDetalle: ${e.message}`);
}
const hoja = libro.getWorksheet('Inventario');
if (!hoja) morir('El Excel no tiene la hoja "Inventario". No le cambies el nombre.');

function numero(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'object') v = v.result ?? v.value ?? v.text ?? '';
  const n = Number(String(v).replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
function texto(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') v = v.result ?? v.value ?? v.text ?? '';
  return String(v).trim();
}

const porSku = new Map(productos.map((p) => [p.sku, p]));
const leidas = [];
const ignoradas = [];
const problemas = [];

hoja.eachRow((fila, n) => {
  if (n < 5) return;
  const sku = texto(fila.getCell(8).value);
  const nombre = texto(fila.getCell(1).value);
  if (!sku) { if (nombre) ignoradas.push(`fila ${n}: "${nombre}" — sin SKU`); return; }
  if (!porSku.has(sku)) { ignoradas.push(`fila ${n}: "${nombre}" — el SKU ${sku} no existe en el catálogo`); return; }

  let precio = numero(fila.getCell(4).value);
  const cantidad = numero(fila.getCell(5).value);
  if (precio !== null && precio <= 0) {
    problemas.push(`fila ${n}: "${nombre}" tiene precio ${precio}. Se dejó el precio anterior.`);
    precio = null;
  }
  leidas.push({
    sku, nombre,
    precio: precio ?? porSku.get(sku).precio,
    cantidad: cantidad === null ? 0 : Math.max(0, Math.round(cantidad)),
    oculto: texto(fila.getCell(6).value).toUpperCase() === 'NO',
  });
});

if (!leidas.length) morir('No pude leer ninguna fila válida. Revisa que no hayas borrado la columna del SKU.');
log(`   ${leidas.length} productos leídos`);

// ---------- Qué cambió ----------
const cambios = [];
for (const f of leidas) {
  const p = porSku.get(f.sku);
  const detalles = [];
  if (p.precio !== f.precio) detalles.push(`precio ${p.precio.toLocaleString('es-CO')} → ${f.precio.toLocaleString('es-CO')}`);
  if ((p.stock ?? 0) !== f.cantidad) detalles.push(`cantidad ${p.stock ?? 0} → ${f.cantidad}`);
  if (Boolean(p.oculto) !== f.oculto) detalles.push(f.oculto ? 'se OCULTA' : 'se muestra');
  if (detalles.length) cambios.push(`${f.nombre.slice(0, 45)} — ${detalles.join(', ')}`);
}

// ---------- Informe ----------
const PRUEBA = process.argv.includes('--probar');

log('\n──────────── RESULTADO ────────────');
log(`✔ Productos en el catálogo : ${leidas.length}`);
log(`✔ Agotados                 : ${leidas.filter((f) => f.cantidad === 0).length}`);
log(`✔ Ocultos en la web        : ${leidas.filter((f) => f.oculto).length}`);
if (cambios.length) log('\nCambió:\n  · ' + cambios.join('\n  · '));
if (problemas.length) log('\n⚠ Ojo:\n  · ' + problemas.join('\n  · '));
if (ignoradas.length) log('\n⚠ Filas ignoradas:\n  · ' + ignoradas.join('\n  · '));

if (PRUEBA) { log('\n🧪 Modo prueba: no se escribió ni se publicó nada.\n'); process.exit(0); }

// ---------- Escribir los archivos ----------
let inv = '// Inventario de El Garaje de Rochi (cantidades en existencia).\n';
inv += '// Se genera desde inventario.xlsx — no lo edites a mano.\n';
inv += `// Última actualización: ${new Date().toLocaleString('es-CO')}\n\n`;
inv += 'export const inventario = {\n';
for (const f of leidas) inv += `  "${f.sku}": ${f.cantidad},\n`;
inv += '};\n';
fs.writeFileSync(INVENTARIO, inv, 'utf-8');

let aj = '// Precios y visibilidad de El Garaje de Rochi.\n';
aj += '// Se genera desde inventario.xlsx — no lo edites a mano.\n';
aj += `// Última actualización: ${new Date().toLocaleString('es-CO')}\n\n`;
aj += 'export const ajustes = {\n';
for (const f of leidas) aj += `  "${f.sku}": { precio: ${f.precio}, oculto: ${f.oculto} },\n`;
aj += '};\n';
fs.writeFileSync(AJUSTES, aj, 'utf-8');

// ---------- Mantener sincronizadas las carpetas de fotos ----------
// Así el programa que corre al prender el PC lee los mismos números y nunca revierte el Excel.
let sincronizadas = 0;
if (fs.existsSync(CARPETAS)) {
  const porSkuCantidad = Object.fromEntries(leidas.map((f) => [f.sku, f.cantidad]));
  for (const carpeta of fs.readdirSync(CARPETAS)) {
    const full = path.join(CARPETAS, carpeta);
    try { if (!fs.statSync(full).isDirectory()) continue; } catch { continue; }
    const sku = (carpeta.trim().match(/\(([A-Z0-9-]+)\)$/) || [])[1];
    if (!sku || !(sku in porSkuCantidad)) continue;
    try { fs.writeFileSync(path.join(full, 'cantidad.txt'), String(porSkuCantidad[sku]), 'utf-8'); sincronizadas++; } catch { /* carpeta de solo lectura */ }
  }
}

log(`✔ Carpetas sincronizadas   : ${sincronizadas}`);

// ---------- Publicar ----------
const git = (...args) => execFileSync('git', args, { cwd: raiz, encoding: 'utf8' });
log('\n🚀 Publicando en la página…');
try {
  git('add', 'server/data/inventario.js', 'server/data/ajustes.js', 'inventario.xlsx');
  const pendiente = git('status', '--porcelain', 'server/data/inventario.js', 'server/data/ajustes.js', 'inventario.xlsx').trim();
  if (!pendiente) { log('\n✅ Ya estaba todo al día. Nada que publicar.\n'); process.exit(0); }
  git('commit', '-m', `Actualizar inventario (${cambios.length} cambios)`);
  git('push', 'origin', 'main');
  log('\n✅ LISTO. La página se actualiza sola en menos de un minuto.');
  log('   https://garaje-de-rochi-xi.vercel.app\n');
} catch (e) {
  const msg = String(e.stdout || '') + String(e.stderr || '') + e.message;
  if (/nothing to commit/i.test(msg)) log('\n✅ Ya estaba todo al día.\n');
  else log(`\n⚠ Los cambios quedaron guardados en el computador, pero no se pudieron publicar.\n\n${msg.trim()}\n\nRevisa el internet y vuelve a intentar.\n`);
}
