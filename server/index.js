import express from "express";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { db } from "./db.js";
import { avisar, mensajePedido } from "./avisos.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Credenciales del panel de moderador (cámbialas en .env)
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "rochi123";
const tokens = new Set(); // sesiones activas en memoria

// Límite alto para permitir logos/imágenes en base64 (data URI) desde el panel.
app.use(express.json({ limit: "6mb" }));

function requireAdmin(req, res, next) {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (tokens.has(t)) return next();
  return res.status(401).json({ error: "No autorizado. Inicia sesión de nuevo." });
}

// Configuración de pago (Wompi). Las llaves se ponen en .env; el secreto NUNCA se expone.
// OJO: el pago en línea está DESACTIVADO en la tienda — el frontend ya no ofrece el botón
// y toda compra se cierra por WhatsApp. Esto se deja por si se reactiva (ver WOMPI.md).
const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || "";
const WOMPI_INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET || "";

// ---------- API ----------

// Info general de la tienda (nombre, categorías, envíos, config de pago)
app.get("/api/tienda", (req, res) => {
  res.json({
    tienda: db.tienda,
    categorias: db.categorias,
    envios: db.envios,
    pago: { habilitado: Boolean(WOMPI_PUBLIC_KEY), wompiPublicKey: WOMPI_PUBLIC_KEY },
    publicUrl: process.env.PUBLIC_URL || "",
  });
});

// Catálogo (con filtros ?categoria= y ?buscar=)
app.get("/api/productos", (req, res) => {
  const { categoria, buscar } = req.query;
  res.json(db.listarProductos({ categoria, buscar }));
});

// Detalle de un producto
app.get("/api/productos/:sku", (req, res) => {
  const producto = db.obtenerProducto(req.params.sku);
  if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
  res.json(producto);
});

// Cotizar envío para un subtotal y región
app.post("/api/envio/cotizar", (req, res) => {
  const { subtotal, region } = req.body || {};
  if (typeof subtotal !== "number") {
    return res.status(400).json({ error: "subtotal (número) es requerido" });
  }
  res.json(db.calcularEnvio(subtotal, region));
});

// ---------- Clientes (registro / inicio de sesión) ----------
const clienteTokens = new Map(); // token -> email

app.post("/api/clientes/registro", (req, res) => {
  try {
    const { email, password, nombre, aceptaPublicidad } = req.body || {};
    const cliente = db.registrarCliente({ email, password, nombre, aceptaPublicidad });
    const token = crypto.randomUUID();
    clienteTokens.set(token, cliente.email);
    res.status(201).json({ token, cliente });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/clientes/login", (req, res) => {
  const { email, password } = req.body || {};
  const cliente = db.autenticarCliente(email, password);
  if (!cliente) return res.status(401).json({ error: "Correo o contraseña incorrectos." });
  const token = crypto.randomUUID();
  clienteTokens.set(token, cliente.email);
  res.json({ token, cliente });
});

// ---------- Pago con Wompi (PSE / tarjeta débito o crédito) ----------
// Calcula el total en el servidor y firma la transacción. El cobro lo procesa Wompi.
app.post("/api/pago/preparar", (req, res) => {
  try {
    if (!WOMPI_PUBLIC_KEY || !WOMPI_INTEGRITY_SECRET) {
      return res.status(503).json({
        error: "El pago en línea aún no está configurado. Falta agregar las llaves de Wompi en el archivo .env.",
      });
    }
    const { items, region } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "El carrito está vacío." });
    }
    // Recalcula el total con los precios reales del servidor (nunca confiar en el cliente).
    let subtotal = 0;
    for (const item of items) {
      const p = db.obtenerProducto(item.sku);
      if (!p) return res.status(400).json({ error: `Producto no encontrado: ${item.sku}` });
      const cant = Math.max(1, Math.round(Number(item.cantidad) || 0));
      subtotal += p.precio * cant;
    }
    const envio = db.calcularEnvio(subtotal, region);
    const total = subtotal + envio.valor;
    const amountInCents = total * 100;
    const currency = "COP";
    const reference = "GR-" + Date.now() + "-" + crypto.randomBytes(3).toString("hex");

    // Firma de integridad exigida por Wompi: SHA256(reference + amount + currency + secreto)
    const signature = crypto
      .createHash("sha256")
      .update(`${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_SECRET}`)
      .digest("hex");

    res.json({ reference, amountInCents, currency, signature, publicKey: WOMPI_PUBLIC_KEY, total });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Crear pedido (checkout). Valida stock y lo descuenta.
app.post("/api/pedidos", async (req, res) => {
  try {
    const { items, cliente, region, formaPago } = req.body || {};
    const pedido = db.crearPedido({ items, cliente, region });
    res.status(201).json(pedido);

    // Aviso al dueño DESDE EL SERVIDOR: llega aunque el cliente cierre la página
    // sin tocar el botón de WhatsApp. Va después de responder para no demorar la compra.
    try {
      const texto = mensajePedido({
        titulo: `NUEVO PEDIDO #${pedido.numero} — ${db.tienda.nombre}`,
        items: pedido.items.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad, precio: i.precio })),
        subtotal: pedido.subtotal,
        total: pedido.total,
        envio: pedido.envio?.gratis
          ? `GRATIS (${pedido.envio.region || region})`
          : `$ ${Number(pedido.envio?.valor || 0).toLocaleString("es-CO")} — ${pedido.envio?.region || region}`,
        pago: formaPago || "Pago contra entrega",
        estado: "Pendiente de confirmar el pago",
        cliente: {
          nombre: cliente?.nombre,
          celular: cliente?.telefono,
          cedula: cliente?.cedula,
          direccion: cliente?.direccion,
          ciudad: cliente?.ciudad,
        },
        referencia: `Pedido #${pedido.numero}`,
      });
      await avisar(texto, `Nuevo pedido #${pedido.numero} — ${db.tienda.nombre}`);
    } catch (e) {
      console.error("No se pudo avisar del pedido:", e);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------- Diagnóstico de los avisos ----------
// Dice qué canales están configurados (sin revelar ninguna clave).
app.get("/api/aviso/estado", (req, res) => {
  res.json({
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    whatsapp: Boolean(process.env.AVISO_WHATSAPP && process.env.CALLMEBOT_APIKEY),
    correo: Boolean(process.env.RESEND_API_KEY && process.env.AVISO_EMAIL),
    wompiEventos: Boolean(process.env.WOMPI_EVENTS_SECRET),
  });
});

// Manda un mensaje de prueba (texto fijo, no sirve para enviar contenido arbitrario).
app.post("/api/aviso/probar", async (req, res) => {
  const texto = [
    `🧪 *PRUEBA DE AVISOS — ${db.tienda.nombre}*`,
    "",
    "Si estás leyendo esto, los avisos de pedidos están funcionando.",
    "No hay ningún pedido real que despachar.",
    "",
    `🕒 ${new Date().toLocaleString("es-CO")}`,
  ].join("\n");
  const r = await avisar(texto, `Prueba de avisos — ${db.tienda.nombre}`);
  res.json(r);
});

// ---------- Webhook de Wompi ----------
// Wompi llama aquí cuando cambia el estado de un pago. Es servidor a servidor:
// llega aunque el cliente cierre el navegador, y trae los datos de envío.
app.post("/api/wompi/webhook", async (req, res) => {
  res.status(200).json({ ok: true }); // a Wompi se le responde rápido o reintenta
  try {
    const evento = req.body || {};
    const t = evento?.data?.transaction;
    if (!t) return;

    const secreto = process.env.WOMPI_EVENTS_SECRET || "";
    let verificado = false;
    if (secreto && evento.signature?.checksum) {
      const partes = (evento.signature.properties || []).map((ruta) =>
        ruta.split(".").reduce((o, k) => (o == null ? o : o[k]), evento.data)
      );
      const calculado = crypto
        .createHash("sha256")
        .update(partes.join("") + String(evento.timestamp) + secreto)
        .digest("hex");
      verificado = calculado.toLowerCase() === String(evento.signature.checksum).toLowerCase();
      if (!verificado) { console.error("Webhook de Wompi con firma inválida. Se ignora."); return; }
    }

    if (t.status !== "APPROVED") return;

    const dir = t.shipping_address || {};
    const texto = mensajePedido({
      titulo: `PAGO APROBADO — ${db.tienda.nombre}`,
      items: [],
      total: (t.amount_in_cents || 0) / 100,
      pago: t.payment_method_type,
      estado: verificado ? "PAGADO ✅ (verificado con Wompi)" : "PAGADO ✅",
      cliente: {
        nombre: t.customer_data?.full_name,
        celular: t.customer_data?.phone_number || dir.phone_number,
        cedula: t.customer_data?.legal_id,
        direccion: [dir.address_line_1, dir.address_line_2].filter(Boolean).join(" "),
        ciudad: [dir.city, dir.region].filter(Boolean).join(", "),
      },
      referencia: t.reference,
      transaccion: t.id,
    });
    await avisar(texto, `PAGO APROBADO — ${db.tienda.nombre}`);
  } catch (err) {
    console.error("Error procesando webhook de Wompi:", err);
  }
});

// Consultar un pedido
app.get("/api/pedidos/:numero", (req, res) => {
  const pedido = db.obtenerPedido(req.params.numero);
  if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });
  res.json(pedido);
});

// ---------- Panel de moderador ----------

app.post("/api/admin/login", (req, res) => {
  const { usuario, clave } = req.body || {};
  if (usuario === ADMIN_USER && clave === ADMIN_PASS) {
    const token = crypto.randomUUID();
    tokens.add(token);
    return res.json({ token, tienda: db.tienda });
  }
  return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  const t = (req.headers.authorization || "").slice(7);
  tokens.delete(t);
  res.json({ ok: true });
});

// Catálogo completo para el panel (incluye todo, sin filtros)
app.get("/api/admin/productos", requireAdmin, (req, res) => {
  res.json({ productos: db.listarProductos({ incluirOcultos: true }), categorias: db.categorias, tienda: db.tienda, envios: db.envios });
});

app.post("/api/admin/productos", requireAdmin, (req, res) => {
  try {
    res.status(201).json(db.crearProductoAdmin(req.body || {}));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/admin/productos/:sku", requireAdmin, (req, res) => {
  try {
    res.json(db.actualizarProducto(req.params.sku, req.body || {}));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/admin/productos/:sku", requireAdmin, (req, res) => {
  try {
    res.json(db.eliminarProducto(req.params.sku));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/admin/tienda", requireAdmin, (req, res) => {
  try {
    res.json(db.actualizarTienda(req.body || {}));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/admin/pedidos", requireAdmin, (req, res) => {
  res.json(db.listarPedidos());
});

// Lista de clientes registrados (sin contraseñas)
app.get("/api/admin/clientes", requireAdmin, (req, res) => {
  res.json(db.listarClientes());
});

// Descargar CSV con los correos que autorizaron publicidad
app.get("/api/admin/clientes/publicidad.csv", requireAdmin, (req, res) => {
  const clientes = db.listarClientes().filter((c) => c.aceptaPublicidad);
  const filas = [["correo", "nombre", "fecha_registro"]];
  for (const c of clientes) filas.push([c.email, (c.nombre || "").replace(/[",\n]/g, " "), c.fecha]);
  const csv = "﻿" + filas.map((f) => f.join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="correos-publicidad.csv"');
  res.send(csv);
});

// ---------- Frontend estático ----------
app.use(express.static(path.join(__dirname, "..", "public")));

// En local levanta el servidor; en Vercel (serverless) se exporta el `app`.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🟢 ${db.tienda.nombre} en línea: http://localhost:${PORT}\n`);
  });
}

export default app;
