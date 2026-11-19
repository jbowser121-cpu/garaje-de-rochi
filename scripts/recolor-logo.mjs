// Recolorea public/logo.jpg hacia el verde azulado (teal) de la página.
// Genera variantes (distinto giro de tono) para elegir, y una imagen comparativa.
// Uso:  node scripts/recolor-logo.mjs            -> genera comparativa + variantes en scratchpad
//       node scripts/recolor-logo.mjs <filtro>   -> aplica ese filtro a public/logo.jpg (definitivo)
import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUB = path.join(RAIZ, "public");
const OUT = process.argv[3] || path.join(RAIZ, "scratchpad-logo");
const filtroFinal = process.argv[2] || null;
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const b64 = fs.readFileSync(path.join(PUB, "logo-original.jpg")).toString("base64");
const dataUrl = `data:image/jpeg;base64,${b64}`;

// Variantes de tono (teal = verde azulado). saturate baja el "neón".
const variantes = [
  ["A  giro 45", "hue-rotate(45deg) saturate(0.92)"],
  ["B  giro 60", "hue-rotate(60deg) saturate(0.85)"],
  ["C  giro 75", "hue-rotate(75deg) saturate(0.8)"],
  ["D  giro 90", "hue-rotate(90deg) saturate(0.78)"],
];

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
const page = await browser.newPage();
await page.setContent("<!doctype html><body></body>", { waitUntil: "load" });

if (filtroFinal) {
  const data = await page.evaluate(async (dataUrl, filtro) => {
    const img = new Image();
    await new Promise((r, j) => { img.onload = r; img.onerror = () => j(new Error("no cargó")); img.src = dataUrl; });
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d"); ctx.filter = filtro; ctx.drawImage(img, 0, 0);
    return c.toDataURL("image/jpeg", 0.92).split(",")[1];
  }, dataUrl, filtroFinal);
  fs.writeFileSync(path.join(PUB, "logo.jpg"), Buffer.from(data, "base64"));
  console.log("APLICADO a public/logo.jpg con filtro:", filtroFinal);
  await browser.close();
  process.exit(0);
}

// Comparativa + variantes sueltas
const res = await page.evaluate(async (dataUrl, variantes) => {
  const img = new Image();
  await new Promise((r, j) => { img.onload = r; img.onerror = () => j(new Error("no cargó")); img.src = dataUrl; });
  const cell = 300, pad = 16, cols = 2, rows = 3, lab = 26;
  const W = cols * cell + (cols + 1) * pad;
  const H = rows * (cell + lab) + (rows + 1) * pad;
  const comp = document.createElement("canvas"); comp.width = W; comp.height = H;
  const cx = comp.getContext("2d"); cx.fillStyle = "#ffffff"; cx.fillRect(0, 0, W, H);
  cx.textBaseline = "middle"; cx.font = "600 16px Segoe UI, sans-serif";
  const draw = (idx, label, filtro) => {
    const col = idx % cols, row = (idx / cols) | 0;
    const x = pad + col * (cell + pad), y = pad + row * (cell + lab + pad);
    cx.fillStyle = "#2f7d73"; cx.fillText(label, x + 4, y + lab / 2);
    cx.save(); cx.filter = filtro || "none"; cx.drawImage(img, x, y + lab, cell, cell); cx.restore();
  };
  draw(0, "Original (actual)", null);
  const sueltas = {};
  variantes.forEach((v, i) => {
    draw(i + 1, v[0], v[1]);
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d"); ctx.filter = v[1]; ctx.drawImage(img, 0, 0);
    sueltas["var" + String.fromCharCode(65 + i) + ".jpg"] = c.toDataURL("image/jpeg", 0.9).split(",")[1];
  });
  return { comparativa: comp.toDataURL("image/png").split(",")[1], sueltas };
}, dataUrl, variantes);

fs.writeFileSync(path.join(OUT, "comparativa.png"), Buffer.from(res.comparativa, "base64"));
for (const [n, d] of Object.entries(res.sueltas)) fs.writeFileSync(path.join(OUT, n), Buffer.from(d, "base64"));
console.log("LISTO ->", OUT);
await browser.close();
