// Bot autónomo de Instagram (Mensajes Directos) usando la Messenger/Instagram Graph API de Meta.
// A diferencia de WhatsApp, Instagram NO permite librerías no oficiales de forma estable:
// se integra con la API oficial mediante un webhook. Este servicio recibe los DMs y responde.
//
// Requisitos previos (una sola vez):
//   1. Cuenta de Instagram *profesional* (Business/Creator) vinculada a una Página de Facebook.
//   2. App en https://developers.facebook.com con los productos "Instagram" y "Messenger".
//   3. Permisos: instagram_manage_messages, pages_manage_metadata.
//   4. Token de acceso de página (PAGE_ACCESS_TOKEN) y un VERIFY_TOKEN inventado por ti.
//   5. Exponer este servidor con HTTPS (ngrok o un dominio propio) y registrar la URL del webhook.
//
// Variables en .env:  IG_VERIFY_TOKEN, IG_PAGE_ACCESS_TOKEN, IG_PORT
import "dotenv/config";
import express from "express";
import { responder } from "./brain.js";

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.IG_VERIFY_TOKEN || "nutrivida_verify";
const PAGE_ACCESS_TOKEN = process.env.IG_PAGE_ACCESS_TOKEN || "";
const PORT = process.env.IG_PORT || 3100;
const GRAPH = "https://graph.facebook.com/v20.0";

// 1) Verificación del webhook (Meta hace un GET al registrar la URL).
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook de Instagram verificado.");
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// 2) Recepción de mensajes (Meta hace POST con cada DM entrante).
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // responder rápido a Meta
  const body = req.body;
  if (body.object !== "instagram" && body.object !== "page") return;

  for (const entry of body.entry || []) {
    for (const evento of entry.messaging || []) {
      const senderId = evento.sender?.id;
      const texto = evento.message?.text;
      // Ignorar echos (mensajes que enviamos nosotros) y eventos sin texto.
      if (!senderId || !texto || evento.message?.is_echo) continue;
      try {
        const respuesta = await responder(texto);
        await enviarMensaje(senderId, respuesta);
        console.log(`💬 IG ${senderId}: "${texto}" -> respondido`);
      } catch (err) {
        console.error("Error respondiendo Instagram:", err.message);
      }
    }
  }
});

async function enviarMensaje(destinatarioId, texto) {
  if (!PAGE_ACCESS_TOKEN) {
    console.warn("⚠️  Falta IG_PAGE_ACCESS_TOKEN; no se envía respuesta real.");
    return;
  }
  const res = await fetch(`${GRAPH}/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: destinatarioId },
      message: { text: texto },
    }),
  });
  if (!res.ok) {
    console.error("Graph API error:", res.status, await res.text());
  }
}

app.listen(PORT, () => {
  console.log(`\n🟣 Webhook de Instagram escuchando en http://localhost:${PORT}/webhook`);
  console.log("   Expón esta URL con HTTPS (ngrok) y regístrala en tu App de Meta.\n");
});
