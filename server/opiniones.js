// Opiniones de clientes guardadas en Supabase vía su API REST (sin dependencias).
// En Vercel el disco es efímero, así que las opiniones NO pueden vivir en un archivo:
// necesitan una base externa. Si SUPABASE_URL/SUPABASE_KEY no están configuradas,
// queda deshabilitado y las rutas lo detectan con configurado().
// Toma solo el origen (https://xxx.supabase.co), aunque peguen la URL con ruta extra.
const RAW = (process.env.SUPABASE_URL || "").trim();
let BASE = "";
try { BASE = RAW ? new URL(RAW).origin : ""; } catch { BASE = RAW.replace(/\/+$/, ""); }
const KEY = (process.env.SUPABASE_KEY || "").trim(); // clave secreta sb_secret_... (solo servidor)
const TABLA = "opiniones";

export function configurado() {
  return Boolean(BASE && KEY);
}

function headers(extra = {}) {
  return { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...extra };
}
function endpoint(qs = "") {
  return `${BASE}/rest/v1/${TABLA}${qs}`;
}

export async function guardar(op) {
  const r = await fetch(endpoint(), {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(op),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return (await r.json())[0];
}

// Solo las aprobadas se muestran en la web pública.
export async function listarPublicas() {
  const qs = "?aprobada=eq.true&select=nombre,servicio,producto,volveria,opinion,creado&order=creado.desc";
  const r = await fetch(endpoint(qs), { headers: headers() });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.json();
}

// Todas (para el panel del dueño): pendientes y aprobadas.
export async function listarTodas() {
  const r = await fetch(endpoint("?select=*&order=creado.desc"), { headers: headers() });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return r.json();
}

export async function aprobar(id, aprobada) {
  const r = await fetch(endpoint(`?id=eq.${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify({ aprobada }),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return (await r.json())[0];
}

export async function borrar(id) {
  const r = await fetch(endpoint(`?id=eq.${encodeURIComponent(id)}`), { method: "DELETE", headers: headers() });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return { ok: true };
}
