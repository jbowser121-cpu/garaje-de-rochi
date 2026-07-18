// Capa de persistencia simple basada en un archivo JSON.
// Suficiente para un MVP; se puede reemplazar por SQLite/Postgres manteniendo la misma interfaz.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { productos, categorias, envios, tienda } from "./data/seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// En Vercel el sistema de archivos es de solo lectura, salvo /tmp (temporal por instancia).
const DATA_DIR = process.env.VERCEL ? "/tmp" : path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "store.json");
// Carpeta de registro con los correos de clientes (para envío de publicidad autorizada).
const REGISTRO_DIR = path.join(DATA_DIR, "registro");
const REGISTRO_CSV = path.join(REGISTRO_DIR, "clientes.csv");

// Campos de detalle que ve el cliente al abrir el producto.
const CAMPOS_DETALLE = ["propiedades", "contenido", "paraQue", "modoUso"];

function detalleVacio() {
  return { propiedades: "", contenido: "", paraQue: "", modoUso: "" };
}

function estadoInicial() {
  return {
    tienda: { logoUrl: "", ...tienda },
    categorias,
    envios,
    // `imagen` vacía por defecto: si no hay URL, el frontend muestra el placeholder de color.
    productos: productos.map((p) => ({ imagen: "", imagenes: [], ...detalleVacio(), ...p })),
    pedidos: [],
    clientes: [],
    secuenciaPedido: 1000,
  };
}

// ---- Hash seguro de contraseñas (scrypt + salt) ----
function hashPassword(plano) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(plano), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(plano, guardado) {
  const [salt, hash] = String(guardado).split(":");
  if (!salt || !hash) return false;
  const intento = crypto.scryptSync(String(plano), salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(intento, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

let data;

function cargar() {
  if (fs.existsSync(DB_PATH)) {
    try {
      data = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      // Migración suave: garantiza campos nuevos en datos antiguos.
      if (!Array.isArray(data.clientes)) data.clientes = [];
      if (!data.tienda.contacto) data.tienda.contacto = tienda.contacto;
      data.productos.forEach((p) => {
        if (p.imagen === undefined) p.imagen = "";
        if (!Array.isArray(p.imagenes)) p.imagenes = [];
        for (const c of CAMPOS_DETALLE) if (p[c] === undefined) p[c] = "";
      });
      return;
    } catch {
      // Si el archivo está corrupto, se regenera.
    }
  }
  data = estadoInicial();
  guardar();
}

function guardar() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    // En entornos de solo lectura no se persiste; los datos quedan en memoria.
    if (!guardar._avisado) { console.warn("No se pudo persistir en disco:", e.message); guardar._avisado = true; }
  }
}

cargar();

export const db = {
  get tienda() {
    return data.tienda;
  },
  get categorias() {
    return data.categorias;
  },
  get envios() {
    return data.envios;
  },

  listarProductos({ categoria, buscar } = {}) {
    let lista = data.productos;
    if (categoria) lista = lista.filter((p) => p.categoria === categoria);
    if (buscar) {
      const q = buscar.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.marca.toLowerCase().includes(q) ||
          p.descripcion.toLowerCase().includes(q)
      );
    }
    return lista;
  },

  obtenerProducto(sku) {
    return data.productos.find((p) => p.sku === sku) || null;
  },

  // Calcula el envío para un subtotal y una región dada.
  calcularEnvio(subtotal, region) {
    const { umbralEnvioGratis, tarifas } = data.envios;
    const tarifa = tarifas.find((t) => t.region === region) || tarifas[tarifas.length - 1];
    // Gratis por región (ej. Granada, Meta) o por superar el umbral.
    if (tarifa.valor === 0) return { valor: 0, gratis: true, region: tarifa.region, dias: tarifa.dias };
    if (subtotal >= umbralEnvioGratis) return { valor: 0, gratis: true, region: tarifa.region, dias: tarifa.dias };
    return { valor: tarifa.valor, gratis: false, region: tarifa.region, dias: tarifa.dias };
  },

  // Crea un pedido y descuenta stock de forma atómica (valida existencias primero).
  crearPedido({ items, cliente, region }) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("El carrito está vacío.");
    }
    const detalle = [];
    let subtotal = 0;

    for (const item of items) {
      const producto = this.obtenerProducto(item.sku);
      if (!producto) throw new Error(`Producto no encontrado: ${item.sku}`);
      const cantidad = Number(item.cantidad);
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        throw new Error(`Cantidad inválida para ${producto.nombre}.`);
      }
      if (producto.stock < cantidad) {
        throw new Error(
          `Stock insuficiente para ${producto.nombre}. Disponibles: ${producto.stock}.`
        );
      }
      detalle.push({
        sku: producto.sku,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad,
        importe: producto.precio * cantidad,
      });
      subtotal += producto.precio * cantidad;
    }

    // Descontar stock una vez validado todo.
    for (const item of detalle) {
      this.obtenerProducto(item.sku).stock -= item.cantidad;
    }

    const envio = this.calcularEnvio(subtotal, region);
    const total = subtotal + envio.valor;
    const numero = ++data.secuenciaPedido;

    const pedido = {
      numero,
      fecha: new Date().toISOString(),
      estado: "pendiente",
      cliente: cliente || {},
      region: region || null,
      items: detalle,
      subtotal,
      envio,
      total,
    };
    data.pedidos.push(pedido);
    guardar();
    return pedido;
  },

  listarPedidos() {
    return data.pedidos;
  },

  obtenerPedido(numero) {
    return data.pedidos.find((p) => p.numero === Number(numero)) || null;
  },

  // Reabastece o ajusta stock (uso administrativo).
  ajustarStock(sku, cantidad) {
    const producto = this.obtenerProducto(sku);
    if (!producto) throw new Error("Producto no encontrado.");
    producto.stock = Math.max(0, cantidad);
    guardar();
    return producto;
  },

  // ---------- Administración (panel de moderador) ----------

  // Actualiza campos permitidos de un producto (precio, stock, imagen, etc.).
  actualizarProducto(sku, cambios = {}) {
    const p = this.obtenerProducto(sku);
    if (!p) throw new Error("Producto no encontrado.");
    const permitido = [
      "nombre", "marca", "categoria", "precio", "stock",
      "imagen", "imagenes", "descripcion", "destacado", "color",
      ...CAMPOS_DETALLE,
    ];
    for (const k of permitido) {
      if (!(k in cambios)) continue;
      if (k === "precio" || k === "stock") p[k] = Math.max(0, Math.round(Number(cambios[k]) || 0));
      else if (k === "destacado") p[k] = Boolean(cambios[k]);
      else if (k === "imagenes") p[k] = Array.isArray(cambios[k]) ? cambios[k].map(String) : [];
      else p[k] = String(cambios[k]);
    }
    guardar();
    return p;
  },

  crearProductoAdmin(d = {}) {
    if (!d.sku || !d.nombre) throw new Error("SKU y nombre son obligatorios.");
    if (this.obtenerProducto(d.sku)) throw new Error("Ya existe un producto con ese SKU.");
    const nuevo = {
      sku: String(d.sku).trim(),
      nombre: String(d.nombre).trim(),
      categoria: d.categoria || "suplementos",
      marca: d.marca || "",
      precio: Math.max(0, Math.round(Number(d.precio) || 0)),
      stock: Math.max(0, Math.round(Number(d.stock) || 0)),
      color: d.color || "#2f6f68",
      imagen: d.imagen || "",
      descripcion: d.descripcion || "",
      destacado: Boolean(d.destacado),
    };
    data.productos.push(nuevo);
    guardar();
    return nuevo;
  },

  eliminarProducto(sku) {
    const i = data.productos.findIndex((p) => p.sku === sku);
    if (i < 0) throw new Error("Producto no encontrado.");
    const [x] = data.productos.splice(i, 1);
    guardar();
    return x;
  },

  actualizarTienda(cambios = {}) {
    const permitido = ["nombre", "iniciales", "logoUrl", "eslogan", "whatsapp", "instagram"];
    for (const k of permitido) {
      if (k in cambios) data.tienda[k] = String(cambios[k]);
    }
    if ("contacto" in cambios && typeof cambios.contacto === "object") {
      data.tienda.contacto = { ...data.tienda.contacto, ...cambios.contacto };
    }
    if ("umbralEnvioGratis" in cambios) {
      data.envios.umbralEnvioGratis = Math.max(0, Math.round(Number(cambios.umbralEnvioGratis) || 0));
    }
    guardar();
    return { tienda: data.tienda, envios: data.envios };
  },

  // ---------- Clientes (registro con correo + contraseña) ----------

  registrarCliente({ email, password, nombre, aceptaPublicidad }) {
    email = String(email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Correo electrónico inválido.");
    if (String(password || "").length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
    if (data.clientes.some((c) => c.email === email)) throw new Error("Ya existe una cuenta con ese correo.");
    const cliente = {
      email,
      nombre: String(nombre || "").trim(),
      passwordHash: hashPassword(password),
      aceptaPublicidad: Boolean(aceptaPublicidad),
      fecha: new Date().toISOString(),
    };
    data.clientes.push(cliente);
    guardar();
    escribirRegistroCSV();
    return { email: cliente.email, nombre: cliente.nombre, aceptaPublicidad: cliente.aceptaPublicidad };
  },

  autenticarCliente(email, password) {
    email = String(email || "").trim().toLowerCase();
    const c = data.clientes.find((x) => x.email === email);
    if (!c || !verifyPassword(password, c.passwordHash)) return null;
    return { email: c.email, nombre: c.nombre, aceptaPublicidad: c.aceptaPublicidad };
  },

  // Lista de clientes SIN el hash de contraseña (uso admin).
  listarClientes() {
    return data.clientes.map(({ passwordHash, ...rest }) => rest);
  },

  // Solo los correos que autorizaron recibir publicidad.
  correosPublicidad() {
    return data.clientes.filter((c) => c.aceptaPublicidad).map((c) => c.email);
  },

  _guardar: guardar,
};

// Escribe/actualiza la carpeta de registro con los correos (para publicidad).
function escribirRegistroCSV() {
  try {
    fs.mkdirSync(REGISTRO_DIR, { recursive: true });
    const filas = [["correo", "nombre", "acepta_publicidad", "fecha_registro"]];
    for (const c of data.clientes) {
      filas.push([c.email, c.nombre.replace(/[",\n]/g, " "), c.aceptaPublicidad ? "SI" : "NO", c.fecha]);
    }
    const csv = filas.map((f) => f.join(",")).join("\n");
    fs.writeFileSync(REGISTRO_CSV, "﻿" + csv, "utf-8"); // BOM para que Excel lea las tildes
  } catch (e) {
    console.error("No se pudo escribir el registro de clientes:", e.message);
  }
}
