// Cerebro compartido por los bots de WhatsApp e Instagram.
// Responde de forma autónoma preguntas frecuentes consultando la API de la tienda.
// Es intencionalmente basado en reglas (sin costo de IA). Puedes conectar un LLM
// en `responderConIA` si quieres respuestas más naturales (ver comentario al final).

const API = process.env.API_URL || "http://localhost:3000";
// Link público que se le muestra al cliente (la tienda en internet).
const TIENDA_URL = process.env.PUBLIC_URL || API;

const money = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

async function api(ruta, opciones) {
  const res = await fetch(`${API}${ruta}`, opciones);
  if (!res.ok) throw new Error(`API ${ruta} -> ${res.status}`);
  return res.json();
}

const SALUDOS = ["hola", "buenas", "buenos dias", "buenas tardes", "buenas noches", "hey", "que tal"];
const DESPEDIDAS = ["gracias", "chao", "adios", "listo", "muchas gracias"];

function normalizar(texto = "") {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function incluyeAlguno(txt, palabras) {
  return palabras.some((p) => txt.includes(p));
}

// Devuelve la respuesta del bot para un mensaje entrante.
export async function responder(mensajeUsuario) {
  const txt = normalizar(mensajeUsuario);
  let info;
  try {
    info = await api("/api/tienda");
  } catch {
    return "Estamos presentando un inconveniente técnico. Escríbenos en un momento por favor 🙏";
  }
  const { tienda, envios } = info;

  // Saludo
  if (incluyeAlguno(txt, SALUDOS) && txt.length < 25) {
    return (
      `¡Hola! 👋 Bienvenid@ a *${tienda.nombre}*.\n` +
      `${tienda.eslogan}.\n\n` +
      `🛒 *Compra fácil en nuestra página:*\n${TIENDA_URL}\n\n` +
      `🛵 Domicilio *GRATIS* en Granada, Meta · Envíos a todo el país.\n\n` +
      `¿En qué te ayudo? Puedes preguntarme por:\n` +
      `• *Precio* de un producto (ej: "precio melatonina")\n` +
      `• *Disponibilidad* / existencias\n` +
      `• *Envíos* y tiempos de entrega\n` +
      `• *Catálogo* o categorías\n` +
      `• *Contacto* / servicio al cliente`
    );
  }

  // Despedida
  if (incluyeAlguno(txt, DESPEDIDAS) && txt.length < 20) {
    return `¡Con gusto! 💚 Cualquier cosa aquí estoy. Compra fácil en ${TIENDA_URL}`;
  }

  // Contacto / servicio al cliente
  if (
    incluyeAlguno(txt, [
      "contacto", "contactar", "servicio al cliente", "servicio", "asesor", "soporte",
      "ayuda", "hablar con", "telefono", "numero", "direccion", "ubicacion", "donde quedan",
      "donde estan", "correo", "email", "pqr", "reclamo",
    ])
  ) {
    const c = tienda.contacto;
    if (c) {
      const ventas = c.ventas
        .map((v) => `• ${v.display} → https://wa.me/${v.numero}`)
        .join("\n");
      const esSoporte = incluyeAlguno(txt, ["soporte", "pagina", "web", "error", "falla", "no funciona", "reclamo", "pqr"]);
      if (esSoporte) {
        return (
          `🛠️ *Soporte de la página*\n` +
          `${c.soporte.display} → https://wa.me/${c.soporte.numero}\n\n` +
          `📧 ${c.correo}\n📍 ${c.direccion}`
        );
      }
      return (
        `📞 *Contacto y servicio al cliente — ${tienda.nombre}*\n\n` +
        `🛒 *Ventas* (WhatsApp):\n${ventas}\n\n` +
        `🛠️ *Soporte de la página:*\n• ${c.soporte.display} → https://wa.me/${c.soporte.numero}\n\n` +
        `📍 ${c.direccion}\n📧 ${c.correo}\n📱 ${c.telefono}`
      );
    }
  }

  // Envíos
  if (incluyeAlguno(txt, ["envio", "envios", "domicilio", "entrega", "despacho", "flete"])) {
    const lineas = envios.tarifas
      .map((t) => `• ${t.region}: ${t.valor === 0 ? "GRATIS" : money(t.valor)} (${t.dias})`)
      .join("\n");
    return (
      `🚚 *Envíos a todo el país*\n${lineas}\n\n` +
      `🛵 *En Granada, Meta el domicilio es GRATIS.*\n` +
      `✅ Envío GRATIS en compras desde ${money(envios.umbralEnvioGratis)}.`
    );
  }

  // Catálogo / categorías
  if (incluyeAlguno(txt, ["catalogo", "productos", "categoria", "categorias", "que venden", "que tienen"])) {
    const cats = info.categorias.map((c) => `• ${c.nombre}`).join("\n");
    return (
      `🛍️ Manejamos vitaminas y suplementos originales en estas categorías:\n${cats}\n\n` +
      `Mira todo el catálogo aquí 👉 ${TIENDA_URL}\n` +
      `Dime el nombre de un producto y te paso *precio y disponibilidad*.`
    );
  }

  // Búsqueda de producto por palabras clave -> precio + stock
  const consulta = txt
    .replace(/precio|valor|cuanto|cuesta|vale|hay|tienen|disponible|stock|de|la|el|los|las/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (consulta.length >= 3) {
    let productos = [];
    try {
      productos = await api(`/api/productos?buscar=${encodeURIComponent(consulta)}`);
    } catch {
      productos = [];
    }
    if (productos.length > 0) {
      const top = productos.slice(0, 4);
      const lineas = top
        .map((p) => {
          const disp = p.stock > 0 ? "✅ Disponible" : "❌ Agotado";
          return `*${p.nombre}*\n${money(p.precio)} — ${disp}`;
        })
        .join("\n\n");
      const extra = productos.length > top.length ? `\n\n(+${productos.length - top.length} resultados más)` : "";
      return `Esto encontré 👇\n\n${lineas}${extra}\n\nPara comprar: ${TIENDA_URL}`;
    }
  }

  // Precio genérico / no entendido
  return (
    `No estoy segur@ de haber entendido 🤔. Puedo ayudarte con:\n` +
    `• Precios y disponibilidad (dime el producto)\n` +
    `• Envíos y tiempos de entrega\n` +
    `• Catálogo completo: ${TIENDA_URL}\n\n` +
    `Si prefieres, un asesor humano te atiende pronto 💚`
  );
}

// Punto de extensión: reemplaza `responder` por una versión con LLM (Claude) si quieres
// respuestas más naturales. Recuerda inyectar el catálogo como contexto para evitar inventos.
// Ejemplo de esqueleto (requiere @anthropic-ai/sdk y ANTHROPIC_API_KEY):
//
// import Anthropic from "@anthropic-ai/sdk";
// const client = new Anthropic();
// export async function responderConIA(mensaje) {
//   const productos = await api("/api/productos");
//   const msg = await client.messages.create({
//     model: "claude-fable-5",
//     max_tokens: 400,
//     system: `Eres el asesor de ${...}. Responde SOLO con datos de este catálogo: ${JSON.stringify(productos)}`,
//     messages: [{ role: "user", content: mensaje }],
//   });
//   return msg.content[0].text;
// }
