// Genera inventario.xlsx a partir del catálogo de la tienda.
// Se corre solo cuando se agregan productos nuevos. Guarda copia del Excel anterior.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { productos, categorias, tienda } from '../server/data/seed.js';

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DESTINO = path.join(raiz, 'inventario.xlsx');

const FUENTE = 'Arial';
const TEAL = 'FF4FB8AB';
const TEAL_OSC = 'FF2E8B80';
const TEAL_CLARO = 'FFE6F5F3';
const AMARILLO = 'FFFFF2CC';
const GRIS = 'FFEDEDED';

if (fs.existsSync(DESTINO)) {
  const sello = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  fs.copyFileSync(DESTINO, path.join(raiz, `inventario-anterior-${sello}.xlsx`));
  console.log('Copia de seguridad guardada.');
}

const nombreCat = Object.fromEntries(categorias.map((c) => [c.slug || c.id, c.nombre]));

const libro = new ExcelJS.Workbook();
libro.creator = tienda.nombre;
libro.created = new Date();

const h = libro.addWorksheet('Inventario', {
  views: [{ state: 'frozen', ySplit: 4, xSplit: 1 }],
  pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
});

h.columns = [
  { width: 52 }, { width: 18 }, { width: 22 }, { width: 14 }, { width: 11 }, { width: 16 }, { width: 20 }, { width: 20 },
];

h.mergeCells('A1:G1');
h.getCell('A1').value = `INVENTARIO — ${tienda.nombre}`;
h.getCell('A1').font = { name: FUENTE, size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
h.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL } };
h.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
h.getRow(1).height = 28;

h.mergeCells('A2:G2');
h.getCell('A2').value =
  'SOLO edites las columnas amarillas: Precio, Cantidad y Mostrar en la web.   '
  + 'Cantidad: unidades que tienes (0 = agotado).   '
  + 'La columna gris del SKU identifica el producto: NO la toques ni cambies el orden de las filas.';
h.getCell('A2').font = { name: FUENTE, size: 9, italic: true, color: { argb: 'FF6b7472' } };
h.getCell('A2').alignment = { wrapText: true, vertical: 'middle' };
h.getRow(2).height = 30;

const cabeceras = ['Producto', 'Marca', 'Categoría', 'Precio', 'Cantidad', 'Mostrar en la web', 'Estado (automático)', 'SKU — no tocar'];
const filaCab = h.getRow(4);
cabeceras.forEach((t, i) => {
  const c = filaCab.getCell(i + 1);
  c.value = t;
  c.font = { name: FUENTE, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL_OSC } };
  c.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
});
filaCab.height = 32;

let r = 5;
for (const p of productos) {
  const fila = h.getRow(r);
  fila.getCell(1).value = p.nombre;
  fila.getCell(2).value = p.marca || '';
  fila.getCell(3).value = nombreCat[p.categoria] || p.categoria;
  fila.getCell(4).value = p.precio;
  fila.getCell(5).value = p.stock ?? 0;
  fila.getCell(6).value = p.oculto ? 'NO' : 'SI';
  fila.getCell(7).value = { formula: `IF(F${r}="NO","Oculto",IF(E${r}<=0,"AGOTADO",IF(E${r}<=5,"Últimas unidades","Disponible")))` };
  fila.getCell(8).value = p.sku;

  fila.font = { name: FUENTE, size: 10 };
  fila.alignment = { vertical: 'middle' };
  fila.getCell(1).alignment = { wrapText: true, vertical: 'middle' };

  for (const col of [4, 5, 6]) {
    fila.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMARILLO } };
    fila.getCell(col).alignment = { horizontal: 'center', vertical: 'middle' };
  }
  fila.getCell(4).numFmt = '"$" #,##0';
  fila.getCell(5).numFmt = '0';
  fila.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
  fila.getCell(7).font = { name: FUENTE, size: 10, bold: true };
  fila.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRIS } };
  fila.getCell(8).font = { name: FUENTE, size: 8, color: { argb: 'FF9A9A9A' } };
  if (r % 2 === 1) for (const col of [1, 2, 3]) fila.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL_CLARO } };
  r++;
}
const ultima = r - 1;

h.dataValidations.add(`E5:E${ultima}`, {
  type: 'whole', operator: 'greaterThanOrEqual', formulae: [0], allowBlank: false,
  showErrorMessage: true, errorTitle: 'Cantidad inválida', error: 'Escribe un número entero de 0 en adelante.',
});
h.dataValidations.add(`F5:F${ultima}`, {
  type: 'list', formulae: ['"SI,NO"'], allowBlank: false,
  showErrorMessage: true, errorTitle: 'Valor inválido', error: 'Escribe SI o NO.',
});

h.addConditionalFormatting({
  ref: `G5:G${ultima}`,
  rules: [
    { type: 'containsText', operator: 'containsText', text: 'AGOTADO', priority: 1, style: { font: { color: { argb: 'FF9C0006' } }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFC7CE' } } } },
    { type: 'containsText', operator: 'containsText', text: 'Últimas', priority: 2, style: { font: { color: { argb: 'FF9C6500' } }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFEB9C' } } } },
    { type: 'containsText', operator: 'containsText', text: 'Oculto', priority: 3, style: { font: { color: { argb: 'FF6b7472' } }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: GRIS } } } },
    { type: 'containsText', operator: 'containsText', text: 'Disponible', priority: 4, style: { font: { color: { argb: 'FF006100' } }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFC6EFCE' } } } },
  ],
});

h.autoFilter = { from: { row: 4, column: 1 }, to: { row: ultima, column: 7 } };

/* ---------- Resumen ---------- */
const res = libro.addWorksheet('Resumen');
res.columns = [{ width: 38 }, { width: 20 }];
res.mergeCells('A1:B1');
res.getCell('A1').value = 'RESUMEN DEL INVENTARIO';
res.getCell('A1').font = { name: FUENTE, size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
res.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL } };
res.getRow(1).height = 24;

const R = `Inventario!$G$5:$G$${ultima}`;
const resumen = [
  ['Productos en el catálogo', { formula: `COUNTA(Inventario!$A$5:$A$${ultima})` }, '0'],
  ['Disponibles', { formula: `COUNTIF(${R},"Disponible")` }, '0'],
  ['Con últimas unidades', { formula: `COUNTIF(${R},"Últimas unidades")` }, '0'],
  ['AGOTADOS', { formula: `COUNTIF(${R},"AGOTADO")` }, '0'],
  ['Ocultos en la web', { formula: `COUNTIF(${R},"Oculto")` }, '0'],
  ['Unidades en existencia', { formula: `SUM(Inventario!$E$5:$E$${ultima})` }, '0'],
  ['Valor del inventario (a precio de venta)', { formula: `SUMPRODUCT(Inventario!$D$5:$D$${ultima},Inventario!$E$5:$E$${ultima})` }, '"$" #,##0'],
];
let rr = 3;
for (const [etiqueta, valor, fmt] of resumen) {
  res.getCell(`A${rr}`).value = etiqueta;
  res.getCell(`A${rr}`).font = { name: FUENTE, size: 11 };
  res.getCell(`B${rr}`).value = valor;
  res.getCell(`B${rr}`).font = { name: FUENTE, size: 11, bold: true };
  res.getCell(`B${rr}`).numFmt = fmt;
  res.getCell(`B${rr}`).alignment = { horizontal: 'right' };
  rr++;
}
res.getCell(`A${rr + 1}`).value = 'Se recalcula solo cuando cambias las cantidades en la hoja Inventario.';
res.getCell(`A${rr + 1}`).font = { name: FUENTE, size: 9, italic: true, color: { argb: 'FF6b7472' } };
res.getCell(`A${rr + 3}`).value = `Generado: ${new Date().toLocaleString('es-CO')}`;
res.getCell(`A${rr + 3}`).font = { name: FUENTE, size: 9, color: { argb: 'FF9A9A9A' } };

/* ---------- Instrucciones ---------- */
const ins = libro.addWorksheet('Instrucciones');
ins.columns = [{ width: 110 }];
const texto = [
  ['CÓMO USAR ESTE EXCEL', 'titulo'],
  ['', ''],
  ['1. Abre la hoja "Inventario".', 'n'],
  ['2. Cambia lo que necesites SOLO en las columnas amarillas.', 'n'],
  ['3. Guarda (Ctrl+S) y cierra el archivo.', 'n'],
  ['4. Doble clic en "Actualizar-pagina.bat" (en la misma carpeta).', 'n'],
  ['5. En menos de un minuto la página web queda actualizada.', 'n'],
  ['', ''],
  ['QUÉ SIGNIFICA CADA COLUMNA', 'sub'],
  ['Precio — lo que cobras hoy. En pesos, sin puntos ni el signo $. Escribe 170000, no $170.000.', 'p'],
  ['Cantidad — cuántas unidades tienes. 0 = en la web sale "Agotado por el momento" y no se puede comprar.', 'p'],
  ['Mostrar en la web — SI aparece en la tienda, NO se esconde por completo sin borrarlo.', 'p'],
  ['Estado — se calcula solo. No lo edites.', 'p'],
  ['SKU — el código del producto. Si lo borras, esa fila se ignora.', 'p'],
  ['', ''],
  ['SOBRE LAS CARPETAS DE FOTOS', 'sub'],
  ['Antes las cantidades se manejaban con el archivo cantidad.txt de cada carpeta en Descargas.', 'p'],
  ['Eso SIGUE funcionando: cuando actualizas desde este Excel, los cantidad.txt se actualizan solos', 'p'],
  ['con los mismos números. Así los dos sistemas siempre dicen lo mismo y nada se pisa.', 'p'],
  ['Puedes seguir usando cualquiera de los dos, pero lo más cómodo es este Excel.', 'p'],
  ['', ''],
  ['REGLAS IMPORTANTES', 'sub'],
  ['· No borres filas ni cambies el orden. Para esconder algo, pon NO en "Mostrar en la web".', 'p'],
  ['· No le cambies el nombre a la hoja "Inventario".', 'p'],
  ['· Para agregar un producto nuevo hacen falta las fotos: pídelo y se agrega.', 'p'],
];
let ri = 1;
for (const [t, tipo] of texto) {
  const c = ins.getCell(`A${ri}`);
  c.value = t;
  if (tipo === 'titulo') { c.font = { name: FUENTE, size: 15, bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL } }; ins.getRow(ri).height = 24; }
  else if (tipo === 'sub') { c.font = { name: FUENTE, size: 11, bold: true, color: { argb: TEAL_OSC } }; }
  else { c.font = { name: FUENTE, size: 10 }; }
  c.alignment = { wrapText: true, vertical: 'middle' };
  ri++;
}

await libro.xlsx.writeFile(DESTINO);
console.log(`\n✅ Excel generado: ${DESTINO}`);
console.log(`   ${productos.length} productos`);
