// Bot autónomo de WhatsApp usando whatsapp-web.js (sesión personal vía QR).
// No requiere API de pago: escanea el QR una vez y queda conectado.
//
// Requisitos:  npm install whatsapp-web.js qrcode-terminal qrcode
// Ejecutar:    npm run bot:whatsapp
//
// Al iniciar, además del QR en la terminal, guarda:
//   bots/whatsapp-qr.png   -> imagen del QR para escanear
//   bots/whatsapp-estado.txt -> "esperando_qr" | "conectado"
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { responder } from "./brain.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QR_PNG = path.join(__dirname, "whatsapp-qr.png");
const ESTADO = path.join(__dirname, "whatsapp-estado.txt");

const setEstado = (s) => {
  try { fs.writeFileSync(ESTADO, s, "utf-8"); } catch {}
};

let Client, LocalAuth, qrcodeTerminal, qrcodeImg;
try {
  const wweb = await import("whatsapp-web.js");
  ({ Client, LocalAuth } = wweb.default || wweb);
  qrcodeTerminal = (await import("qrcode-terminal")).default;
  qrcodeImg = (await import("qrcode")).default;
} catch (e) {
  console.error(
    "\n❌ Falta instalar dependencias del bot de WhatsApp.\n" +
      "   Ejecuta:  npm install whatsapp-web.js qrcode-terminal qrcode\n" +
      "   Detalle: " + e.message + "\n"
  );
  process.exit(1);
}

setEstado("iniciando");

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, "..", ".wwebjs_auth") }),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  },
});

// Modo "código de 8 dígitos": si WA_PAIR_NUMBER está definido, en vez del QR se genera
// un código para escribir en el teléfono (Vincular con número de teléfono).
const PAIR_NUMBER = (process.env.WA_PAIR_NUMBER || "").replace(/[^0-9]/g, "");
const CODIGO_TXT = path.join(__dirname, "whatsapp-codigo.txt");
let pairSolicitado = false;

client.on("qr", async (qr) => {
  if (PAIR_NUMBER && !pairSolicitado) {
    pairSolicitado = true;
    try {
      const codigo = await client.requestPairingCode(PAIR_NUMBER);
      console.log(`\n🔢 Código de vinculación para +${PAIR_NUMBER}: ${codigo}\n`);
      fs.writeFileSync(CODIGO_TXT, codigo, "utf-8");
      setEstado("esperando_codigo");
    } catch (e) {
      console.error("No se pudo generar el código de vinculación:", e.message);
      pairSolicitado = false;
    }
    return;
  }
  if (PAIR_NUMBER) return; // ya se pidió el código; no mostrar QR
  console.log("\n📲 Escanea este QR con WhatsApp (Ajustes > Dispositivos vinculados):\n");
  qrcodeTerminal.generate(qr, { small: true });
  try {
    await qrcodeImg.toFile(QR_PNG, qr, { width: 380, margin: 2 });
    console.log(`\n🖼️  QR guardado en: ${QR_PNG}`);
  } catch (e) {
    console.error("No se pudo guardar el QR como imagen:", e.message);
  }
  setEstado("esperando_qr");
});

client.on("authenticated", () => console.log("🔐 Autenticado con WhatsApp."));

client.on("ready", () => {
  console.log("\n🟢 Bot de WhatsApp conectado y respondiendo.\n");
  setEstado("conectado");
  try { fs.existsSync(QR_PNG) && fs.unlinkSync(QR_PNG); } catch {}
});

// --- Responder SOLO a chats nuevos ---
// Guarda cuándo se le respondió por última vez a cada contacto. Si ya se le respondió
// hace menos de VENTANA_HORAS, no se vuelve a responder (para que un humano atienda la
// conversación). Después de ese tiempo de silencio, se considera un chat nuevo.
const VENTANA_HORAS = 8;
const CHATS_FILE = path.join(__dirname, "whatsapp-chats.json");
let ultimoResponde = {};
try { ultimoResponde = JSON.parse(fs.readFileSync(CHATS_FILE, "utf-8")); } catch {}
const guardarChats = () => { try { fs.writeFileSync(CHATS_FILE, JSON.stringify(ultimoResponde)); } catch {} };

client.on("message", async (msg) => {
  // Ignorar estados y grupos (responde solo chats directos)
  if (msg.from.endsWith("@g.us") || msg.isStatus) return;

  const ahora = Date.now();
  const ultimo = ultimoResponde[msg.from] || 0;
  const esChatNuevo = ahora - ultimo > VENTANA_HORAS * 60 * 60 * 1000;

  // Marca la actividad SIEMPRE (para que la conversación siga contando como "en curso").
  ultimoResponde[msg.from] = ahora;
  guardarChats();

  if (!esChatNuevo) {
    console.log(`🔕 ${msg.from}: mensaje en conversación en curso -> NO se responde (atiende un humano)`);
    return;
  }

  try {
    const respuesta = await responder(msg.body || "");
    await msg.reply(respuesta);
    console.log(`💬 ${msg.from}: chat NUEVO -> respondido`);
  } catch (err) {
    console.error("Error respondiendo WhatsApp:", err.message);
  }
});

client.on("disconnected", (r) => {
  console.log("⚠️  WhatsApp desconectado:", r);
  setEstado("desconectado");
});

client.initialize();
