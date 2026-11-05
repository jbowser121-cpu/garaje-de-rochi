// Cola de WhatsApp al cliente, en Supabase (misma base y patrón que opiniones.js).
// Vercel no puede enviar WhatsApp por whatsapp-web.js (es serverless y sin sesión),
// así que ENCOLA el mensaje aquí; el bot del PC (bots/whatsapp.js) lo vacía y lo envía.
// Tabla: cola_whatsapp(id, telefono, mensaje, enviado bool, creado).
// ponytail: boilerplate REST duplicado de opiniones.js; si aparece una 3ª tabla, factorizar en supabase.js
const RAW = (process.env.SUPABASE_URL || "").trim();
let BASE = "";
try { BASE = RAW ? new URL(RAW).origin : ""; } catch { BASE = RAW.replace(/\/+$/, ""); }
const KEY = (process.env.SUPABASE_KEY || "").trim();
const TABLA = "cola_whatsapp";

export function configurado() {
  return Boolean(BASE && KEY);
}

function headers(extra = {}) {
  return { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...extra };
}
function endpoint(qs = "") {
  return `${BASE}/rest/v1/${TABLA}${qs}`;
}

// Deja el número listo para WhatsApp: solo dígitos y con indicativo de país (Colombia).
export function normTel(tel = "") {
  const d = String(tel).replace(/\D/g, "");
  if (d.length === 10 && d.startsWith("3")) return "57" + d; // celular colombiano sin indicativo
  return d; // ya trae indicativo (573..., o país distinto)
}

export async function encolar(telefono, mensaje) {
  const tel = normTel(telefono);
  if (!tel) return null;
  const r = await fetch(endpoint(), {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify({ telefono: tel, mensaje, enviado: false }),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return (await r.json())[0];
}

export async function pendientes() {
  const qs = "?enviado=eq.false&select=id,telefono,mensaje&order=creado.asc&limit=20";
  const r = await fetch(endpoint(qs), { headers: headers() });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.json();
}

export async function marcarEnviado(id) {
  const r = await fetch(endpoint(`?id=eq.${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ enviado: true }),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return { ok: true };
}

// Autocomprobación: node server/colawa.js
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, "/")) {
  console.assert(normTel("+57 314 450 3681") === "573144503681", "normaliza con indicativo y espacios");
  console.assert(normTel("3144503681") === "573144503681", "antepone 57 a celular de 10 dígitos");
  console.assert(normTel("573144503681") === "573144503681", "deja intacto el que ya trae 57");
  console.log("colawa OK");
}
