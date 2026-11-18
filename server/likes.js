// Likes (corazones) por producto, en Supabase. Una FILA por (producto, visitante):
// así el conteo es real y nadie puede dar like dos veces al mismo producto.
// Tabla: likes_producto(sku text, visitante text, creado, primary key(sku,visitante)).
// Mismo patrón REST que opiniones.js / colawa.js (sin dependencias nuevas).
// ponytail: boilerplate REST repetido; factorizar en supabase.js si crece a una 4ª tabla
const RAW = (process.env.SUPABASE_URL || "").trim();
let BASE = "";
try { BASE = RAW ? new URL(RAW).origin : ""; } catch { BASE = RAW.replace(/\/+$/, ""); }
const KEY = (process.env.SUPABASE_KEY || "").trim();
const TABLA = "likes_producto";

export function configurado() {
  return Boolean(BASE && KEY);
}

function headers(extra = {}) {
  return { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...extra };
}
function endpoint(qs = "") {
  return `${BASE}/rest/v1/${TABLA}${qs}`;
}

// { sku: cantidad } para todos los productos con al menos un like.
export async function contar() {
  const r = await fetch(endpoint("?select=sku&limit=100000"), { headers: headers() });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  const filas = await r.json();
  const m = {};
  for (const f of filas) m[f.sku] = (m[f.sku] || 0) + 1;
  return m;
}

export async function contarUno(sku) {
  const r = await fetch(endpoint(`?sku=eq.${encodeURIComponent(sku)}&select=sku&limit=100000`), { headers: headers() });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return (await r.json()).length;
}

// Dar like: inserta la fila; si ya existía (mismo visitante) no falla ni duplica.
export async function dar(sku, visitante) {
  const r = await fetch(endpoint(), {
    method: "POST",
    headers: headers({ Prefer: "resolution=ignore-duplicates" }),
    body: JSON.stringify({ sku, visitante }),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return true;
}

// Quitar like de ese visitante para ese producto.
export async function quitar(sku, visitante) {
  const r = await fetch(
    endpoint(`?sku=eq.${encodeURIComponent(sku)}&visitante=eq.${encodeURIComponent(visitante)}`),
    { method: "DELETE", headers: headers() }
  );
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return true;
}
