// Genera los íconos PNG de la tienda a partir de public/logo.jpg con Puppeteer
// (ya instalado como dependencia de whatsapp-web.js). Sin dependencias nuevas.
// Incrusta la imagen como data-URL y la dibuja en un <canvas> -> PNG fiable.
// Uso:  node scripts/gen-iconos.mjs
import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUB = path.join(RAIZ, "public");
const b64 = fs.readFileSync(path.join(PUB, "logo.jpg")).toString("base64");
const dataUrl = `data:image/jpeg;base64,${b64}`;

const salidas = [
  ["icon-512.png", 512],
  ["icon-192.png", 192],
  ["apple-touch-icon.png", 180],
  ["favicon-32.png", 32],
  ["favicon-16.png", 16],
];

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
const page = await browser.newPage();
await page.setContent("<!doctype html><body></body>", { waitUntil: "load" });

const resultados = await page.evaluate(async (dataUrl, salidas) => {
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error("no cargó la imagen")); img.src = dataUrl; });
  const out = {};
  for (const [nombre, size] of salidas) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    // object-fit: cover (la imagen es cuadrada, así que llena sin deformar)
    const s = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
    // muestra el pixel central para confirmar que NO quedó en blanco
    const p = ctx.getImageData(size / 2, size / 2, 1, 1).data;
    out[nombre] = { data: c.toDataURL("image/png").split(",")[1], pixel: [p[0], p[1], p[2], p[3]] };
  }
  return out;
}, dataUrl, salidas);

for (const [nombre] of salidas) {
  const r = resultados[nombre];
  fs.writeFileSync(path.join(PUB, nombre), Buffer.from(r.data, "base64"));
  console.log("ok", nombre, "pixel central rgba=", r.pixel.join(","));
}
await browser.close();
console.log("LISTO");
