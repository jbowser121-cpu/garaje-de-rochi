import express from "express";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { db } from "./db.js";

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
app.post("/api/pedidos", (req, res) => {
  try {
    const { items, cliente, region } = req.body || {};
    const pedido = db.crearPedido({ items, cliente, region });
    res.status(201).json(pedido);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
  res.json({ productos: db.listarProductos(), categorias: db.categorias, tienda: db.tienda, envios: db.envios });
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
