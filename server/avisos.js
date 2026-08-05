// Envía el aviso de cada pedido al dueño de la tienda, DESDE EL SERVIDOR.
// No depende de que el cliente presione ningún botón.
//
// Canales (se activan con variables de entorno; se puede tener varios a la vez):
//   AVISO_WHATSAPP + CALLMEBOT_APIKEY   → WhatsApp (gratis, vía CallMeBot)
//   TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID → Telegram
//   RESEND_API_KEY + AVISO_EMAIL        → correo electrónico
//
// Si no hay ninguno configurado, el pedido igual queda escrito en el registro del
// servidor (Vercel → pestaña Logs), para que nunca se pierda del todo.

const cop = (n) => "$ " + Number(n || 0).toLocaleString("es-CO");

// Arma el texto del pedido tal como quieres verlo en el celular.
export function mensajePedido({ titulo, items, subtotal, total, envio, pago, cliente, referencia, transaccion, estado }) {
  const lineas = (items || []).map(
    (i) => `• ${i.cantidad} x ${i.nombre}${i.opcion ? ` (${i.opcion})` : ""} = ${cop(i.precio * i.cantidad)}`
  );

  return [
    `🛒 *${titulo}*`,
    "",
    "*Productos:*",
    ...(lineas.length ? lineas : ["(sin detalle de productos)"]),
    "",
    subtotal ? `Subtotal: ${cop(subtotal)}` : "",
    `*TOTAL: ${cop(total)}*`,
    envio ? `🚚 Entrega: ${envio}` : "",
    pago ? `💳 Pago: ${pago}` : "",
    estado ? `📌 Estado: ${estado}` : "",
    "",
    "*A NOMBRE DE / DÓNDE ENVIAR:*",
    `👤 ${cliente?.nombre || "(no informó)"}`,
    `📱 ${cliente?.celular || "(no informó)"}`,
    cliente?.cedula ? `🪪 Cédula: ${cliente.cedula}` : "",
    `📍 ${cliente?.direccion || "(no informó)"}`,
    cliente?.ciudad ? `🏙️ ${cliente.ciudad}` : "",
    "",
    referencia ? `Referencia: ${referencia}` : "",
    transaccion ? `Transacción Wompi: ${transaccion}` : "",
    `🕒 ${new Date().toLocaleString("es-CO")}`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

async function porWhatsApp(texto) {
  const numero = (process.env.AVISO_WHATSAPP || "").replace(/[^0-9]/g, "");
  const apikey = process.env.CALLMEBOT_APIKEY || "";
  if (!numero || !apikey) return null;
  const url = `https://api.callmebot.com/whatsapp.php?phone=${numero}&apikey=${apikey}&text=${encodeURIComponent(texto)}`;
  const r = await fetch(url);
  const cuerpo = await r.text();
  if (!r.ok) throw new Error(`CallMeBot ${r.status}: ${cuerpo.slice(0, 120)}`);
  return "whatsapp";
}

async function porTelegram(texto) {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  const chat = process.env.TELEGRAM_CHAT_ID || "";
  if (!token || !chat) return null;

  const enviar = (cuerpo) =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });

  // Se intenta primero con negritas. Si el nombre o la dirección del cliente traen
  // caracteres que rompen el formato (_ * [ `), Telegram rechaza el mensaje entero:
  // por eso el segundo intento va sin formato. Un pedido no se pierde por un guion bajo.
  const intentos = [
    { chat_id: chat, text: texto, parse_mode: "Markdown" },
    { chat_id: chat, text: texto },
  ];

  let ultimoError = "";
  for (const cuerpo of intentos) {
    const r = await enviar(cuerpo);
    if (r.ok) return "telegram";

    const d = await r.json().catch(() => ({}));
    ultimoError = `${r.status} ${d.description || ""}`.trim();

    // Cuando un grupo normal se convierte en supergrupo, Telegram le cambia el id y
    // devuelve el nuevo aquí. Se reenvía al id nuevo para no perder el pedido, y se
    // avisa para que lo actualicen en las variables de entorno.
    const nuevo = d?.parameters?.migrate_to_chat_id;
    if (nuevo) {
      const r2 = await enviar({ ...cuerpo, chat_id: nuevo });
      if (r2.ok) {
        console.warn(`El grupo de Telegram cambió de id. Actualiza TELEGRAM_CHAT_ID a ${nuevo}`);
        return `telegram (OJO: cambia TELEGRAM_CHAT_ID a ${nuevo})`;
      }
    }
  }
  throw new Error(`Telegram ${ultimoError}`.slice(0, 220));
}

async function porCorreo(texto, asunto) {
  const key = process.env.RESEND_API_KEY || "";
  const para = process.env.AVISO_EMAIL || "";
  if (!key || !para) return null;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.AVISO_EMAIL_FROM || "Pedidos <onboarding@resend.dev>",
      to: [para],
      subject: asunto,
      text: texto,
    }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 120)}`);
  return "correo";
}

// Manda el aviso por todos los canales configurados. Nunca lanza error:
// un fallo de notificación no puede tumbar un pedido ni un pago.
export async function avisar(texto, asunto = "Nuevo pedido") {
  // El registro del servidor es la última red: aunque no haya ningún canal activo,
  // el pedido queda escrito en los Logs de Vercel.
  console.log("\n=== AVISO DE PEDIDO ===\n" + texto + "\n=======================\n");

  const enviados = [];
  const errores = [];
  const canales = [porWhatsApp(texto), porTelegram(texto), porCorreo(texto, asunto)];

  const resultados = await Promise.allSettled(canales);
  for (const r of resultados) {
    if (r.status === "fulfilled" && r.value) enviados.push(r.value);
    else if (r.status === "rejected") errores.push(String(r.reason?.message || r.reason));
  }

  if (errores.length) console.error("Fallaron avisos:", errores.join(" | "));
  if (!enviados.length) console.warn("Ningún canal de aviso configurado o todos fallaron. El pedido quedó solo en este registro.");
  return { enviados, errores };
}
