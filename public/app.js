// Lógica de la tienda: catálogo, filtros, búsqueda, carrito y checkout.
const money = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const state = {
  tienda: null,
  categorias: [],
  envios: null,
  pago: { habilitado: false, wompiPublicKey: "" },
  productos: [],
  categoriaActiva: null,
  busqueda: "",
  cart: JSON.parse(localStorage.getItem("cart") || "{}"), // { sku: cantidad }
  cliente: JSON.parse(localStorage.getItem("gr_cliente") || "null"), // { email, nombre } o null
};

const $ = (sel) => document.querySelector(sel);

async function init() {
  const info = await fetch("/api/tienda").then((r) => r.json());
  state.tienda = info.tienda;
  state.categorias = info.categorias;
  state.envios = info.envios;
  state.pago = info.pago || { habilitado: false };
  state.publicUrl = info.publicUrl || window.location.origin;

  document.title = `${info.tienda.nombre} — Vitaminas y Suplementos`;
  $("#brandName").textContent = info.tienda.nombre;
  if (info.tienda.logoUrl) {
    $("#brandLogo").innerHTML = `<img src="${info.tienda.logoUrl}" alt="${info.tienda.nombre}">`;
    $("#brandLogo").style.background = "#f6efe4";
  }
  $("#freeshipBanner").textContent = `🚚 Envío GRATIS en compras desde ${money(info.envios.umbralEnvioGratis)} · Envíos a todo el país`;
  $("#whatsappFab").href = `https://wa.me/${info.tienda.whatsapp}?text=${encodeURIComponent("Hola, quiero información de un producto")}`;

  renderTicker();
  renderNav();
  renderChips();
  renderRegionSelect();
  renderCuenta();
  renderContacto();
  await cargarProductos();
  renderShowcase();
  bindEvents();
  renderCart();
}

// ---------- Cinta de anuncios en movimiento ----------
function renderTicker() {
  const t = state.tienda;
  const c = t.contacto || {};
  const ig = (t.instagram || "").replace(/^@/, "");
  const items = [
    `📍 Estamos en <b>${c.direccion || "Granada, Meta"}</b>`,
    `🛵 Domicilio <b>GRATIS</b> en Granada, Meta`,
    `🚚 Envíos a <b>todo Colombia</b>`,
    `📱 Pedidos por WhatsApp: <b>${c.telefono || "+57 314 450 3681"}</b>`,
    `📸 Síguenos en Instagram: <b>${t.instagram || "@elgarajederochi"}</b>`,
    `💳 Paga con tarjeta, PSE o contra entrega`,
    `🌿 Vitaminas y suplementos <b>originales</b>`,
  ];
  const linea = items.map((i) => `<span>${i}</span>`).join("<span>•</span>");
  // Se duplica el contenido para que el desplazamiento sea continuo (loop del -50%).
  $("#tickerTrack").innerHTML = linea + `<span>•</span>` + linea;
  // Instagram clickeable en el FAB no; aquí solo texto.
  void ig;
}

// ---------- Lo más pedido (showcase rotativo) ----------
let showcaseTimer = null;
function renderShowcase() {
  // Elige ~10 productos: primero los destacados, luego el resto, con foto.
  const conFoto = state.productos.filter((p) => p.imagen);
  const destacados = conFoto.filter((p) => p.destacado);
  const resto = conFoto.filter((p) => !p.destacado);
  const seleccion = [...destacados, ...resto].slice(0, 10);
  if (seleccion.length === 0) return;

  const stage = $("#showcaseStage");
  const dots = $("#showcaseDots");
  $("#showcase").hidden = false;
  dots.innerHTML = seleccion
    .map((_, i) => `<button class="showcase__dot ${i === 0 ? "active" : ""}" data-i="${i}" aria-label="Producto ${i + 1}"></button>`)
    .join("");
  const botones = [...dots.querySelectorAll(".showcase__dot")];

  let idx = 0;
  const pintar = (i) => {
    const p = seleccion[i];
    stage.innerHTML = `
      <div class="showcase__img">
        <img src="${p.imagen}" alt="${p.nombre}" class="showcase__fade" onerror="this.style.display='none'">
        <span class="showcase__wm">El Garaje de Rochi</span>
      </div>
      <div class="showcase__info showcase__fade">
        <div class="showcase__brand">${p.marca || ""}</div>
        <div class="showcase__name">${p.nombre}</div>
        <div class="showcase__price">${money(p.precio)}</div>
        <button class="btn btn--primary" data-add-showcase="${p.sku}" ${p.stock <= 0 ? "disabled" : ""}>
          ${p.stock <= 0 ? "Agotado" : "Agregar al carrito 🛒"}
        </button>
      </div>`;
    botones.forEach((b, bi) => b.classList.toggle("active", bi === i));
    const addBtn = stage.querySelector("[data-add-showcase]");
    if (addBtn) addBtn.addEventListener("click", () => addToCart(addBtn.dataset.addShowcase));
  };
  const avanzar = (i) => { idx = (i + seleccion.length) % seleccion.length; pintar(idx); };

  botones.forEach((b) =>
    b.addEventListener("click", () => { avanzar(Number(b.dataset.i)); reiniciarTimer(); })
  );
  const reiniciarTimer = () => {
    clearInterval(showcaseTimer);
    showcaseTimer = setInterval(() => avanzar(idx + 1), 10000); // cambia cada 10 segundos
  };

  pintar(0);
  reiniciarTimer();
}

// ---------- Contacto / servicio al cliente ----------
function renderContacto() {
  const c = state.tienda.contacto;
  if (!c) return;
  const waLink = (num, etiqueta) =>
    `<a class="contacto__item wa" href="https://wa.me/${num}?text=${encodeURIComponent("Hola El Garaje de Rochi, necesito información 🌿")}" target="_blank" rel="noopener">💬 <span><span class="ci-num">${etiqueta}</span><span class="ci-sub">Escribir por WhatsApp</span></span></a>`;

  const ventasHtml = c.ventas.map((v) => waLink(v.numero, v.display)).join("");
  $("#contactoBody").innerHTML = `
    <div class="contacto__grupo">
      <h3>🛒 Ventas</h3>
      ${ventasHtml}
    </div>
    <div class="contacto__grupo">
      <h3>🛠️ Soporte de la página</h3>
      ${waLink(c.soporte.numero, c.soporte.display)}
    </div>
    <div class="contacto__grupo">
      <h3>📍 Datos de contacto</h3>
      <div class="contacto__dato">📍 <span>${c.direccion}</span></div>
      <div class="contacto__dato">📧 <a href="mailto:${c.correo}">${c.correo}</a></div>
      <div class="contacto__dato">📱 <a href="tel:${c.telefono.replace(/\s/g, "")}">${c.telefono}</a></div>
    </div>`;

  const ventasFooter = c.ventas
    .map((v) => `<a href="https://wa.me/${v.numero}" target="_blank" rel="noopener">${v.display}</a>`)
    .join(" · ");
  $("#footerContacto").innerHTML = `
    <span>📍 ${c.direccion}</span>
    <span>📧 <a href="mailto:${c.correo}">${c.correo}</a></span>
    <span>🛒 Ventas: ${ventasFooter}</span>
    <span>🛠️ Soporte: <a href="https://wa.me/${c.soporte.numero}" target="_blank" rel="noopener">${c.soporte.display}</a></span>`;
}
function abrirContacto() {
  $("#contactModal").classList.add("open");
  $("#contactModal").setAttribute("aria-hidden", "false");
}
function cerrarContacto() {
  $("#contactModal").classList.remove("open");
  $("#contactModal").setAttribute("aria-hidden", "true");
}

function renderNav() {
  $("#nav").innerHTML = state.categorias
    .map((c) => `<button data-cat="${c.id}">${c.nombre}</button>`)
    .join("");
  $("#nav").querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => {
      state.categoriaActiva = b.dataset.cat;
      state.busqueda = "";
      $("#buscar").value = "";
      syncChips();
      cargarProductos();
    })
  );
}

function renderChips() {
  const chips = [{ id: null, nombre: "Todos" }, ...state.categorias];
  $("#chips").innerHTML = chips
    .map((c) => `<button class="chip ${c.id === state.categoriaActiva ? "active" : ""}" data-cat="${c.id ?? ""}">${c.nombre}</button>`)
    .join("");
  $("#chips").querySelectorAll(".chip").forEach((b) =>
    b.addEventListener("click", () => {
      state.categoriaActiva = b.dataset.cat || null;
      syncChips();
      cargarProductos();
    })
  );
}

function syncChips() {
  $("#chips").querySelectorAll(".chip").forEach((b) => {
    const cat = b.dataset.cat || null;
    b.classList.toggle("active", cat === state.categoriaActiva);
  });
}

function renderRegionSelect() {
  $("#regionSelect").innerHTML = state.envios.tarifas
    .map((t) => `<option value="${t.region}">${t.region} — ${money(t.valor)} (${t.dias})</option>`)
    .join("");
}

async function cargarProductos() {
  const params = new URLSearchParams();
  if (state.categoriaActiva) params.set("categoria", state.categoriaActiva);
  if (state.busqueda) params.set("buscar", state.busqueda);
  state.productos = await fetch(`/api/productos?${params}`).then((r) => r.json());
  renderGrid();
}

function stockLabel(stock) {
  if (stock <= 0) return { cls: "out", txt: "Agotado" };
  if (stock <= 5) return { cls: "low", txt: `¡Últimas ${stock} unidades!` };
  return { cls: "ok", txt: `${stock} disponibles` };
}

function bottle(p) {
  const nombreCorto = p.marca.length > 12 ? p.marca.slice(0, 12) : p.marca;
  return `<div class="card__bottle" style="background:${p.color}"><span>${nombreCorto}</span></div>`;
}

function renderGrid() {
  const grid = $("#grid");
  if (state.productos.length === 0) {
    grid.innerHTML = `<p class="empty">No encontramos productos para tu búsqueda.</p>`;
    return;
  }
  grid.innerHTML = state.productos
    .map((p) => {
      const enCarrito = state.cart[p.sku] || 0;
      const agotado = p.stock <= 0;
      return `
      <article class="card">
        <div class="card__img" style="background:${p.color}22" data-ver="${p.sku}" title="Ver más grande">
          ${p.destacado ? '<span class="card__pill">★ Destacado</span>' : ""}
          ${bottle(p)}
          ${p.imagen ? `<img src="${p.imagen}" alt="${p.nombre}" class="card__photo" loading="lazy" onerror="this.remove()">` : ""}
        </div>
        <div class="card__body">
          <div class="card__brand">${p.marca}</div>
          <div class="card__name">${p.nombre}</div>
          <div class="card__price">${money(p.precio)}</div>
          <div class="card__actions">
            <button class="btn btn--primary btn--block" data-add="${p.sku}" ${agotado ? "disabled" : ""}>
              ${agotado ? "Agotado" : enCarrito ? `En carrito (${enCarrito}) · Agregar` : "Agregar al carrito"}
            </button>
          </div>
        </div>
      </article>`;
    })
    .join("");
  grid.querySelectorAll("[data-add]").forEach((b) =>
    b.addEventListener("click", () => addToCart(b.dataset.add))
  );
  grid.querySelectorAll("[data-ver]").forEach((el) =>
    el.addEventListener("click", () => abrirProducto(el.dataset.ver))
  );
}

// ---------- Detalle de producto (foto grande con marca de agua) ----------
function abrirProducto(sku) {
  const p = state.productos.find((x) => x.sku === sku);
  if (!p) return;
  $("#pmNombre").textContent = p.nombre;
  $("#pmMarca").textContent = p.marca || "";
  $("#pmPrecio").textContent = money(p.precio);
  // Galería: usa imagenes[] si existe; si no, la imagen principal.
  const fotos = (Array.isArray(p.imagenes) && p.imagenes.length ? p.imagenes : [p.imagen]).filter(Boolean);
  const img = $("#pmImg");
  if (fotos.length) { img.src = fotos[0]; img.style.display = ""; }
  else { img.style.display = "none"; }
  const thumbs = $("#pmThumbs");
  if (fotos.length > 1) {
    thumbs.innerHTML = fotos
      .map((f, i) => `<img src="${f}" class="pm__thumb ${i === 0 ? "active" : ""}" data-i="${i}" onerror="this.remove()">`)
      .join("");
    thumbs.querySelectorAll(".pm__thumb").forEach((t) =>
      t.addEventListener("click", () => {
        img.src = fotos[Number(t.dataset.i)];
        thumbs.querySelectorAll(".pm__thumb").forEach((x) => x.classList.remove("active"));
        t.classList.add("active");
      })
    );
  } else {
    thumbs.innerHTML = "";
  }

  // Secciones tipo acordeón (como en una tienda profesional).
  const secciones = [
    ["Descripción", p.descripcion, true],
    ["¿Por qué elegirlo? / Para qué sirve", p.paraQue, false],
    ["Uso sugerido", p.modoUso, false],
    ["Tiempo de envío", textoEnvios(), false],
    ["Métodos de pago", textoPagos(), false],
  ];
  $("#pmSections").innerHTML = secciones
    .filter(([, val]) => val && String(val).trim())
    .map(([tit, val, open]) =>
      `<details class="pm__acc" ${open ? "open" : ""}>
         <summary><span class="h4">${tit}</span></summary>
         <div class="pm__acc__body">${escapeHtml(val)}</div>
       </details>`
    )
    .join("");

  const addBtn = $("#pmAdd");
  addBtn.disabled = p.stock <= 0;
  addBtn.textContent = p.stock <= 0 ? "Agotado" : "Agregar al carrito 🛒";
  addBtn.onclick = () => { addToCart(sku); cerrarProducto(); };

  renderSugerencias(sku);

  $("#productModal").classList.add("open");
  $("#productModal").setAttribute("aria-hidden", "false");
  const box = $("#productModal").querySelector(".modal__box");
  if (box) box.scrollTop = 0;
}

// Texto de tiempos de envío (desde la configuración).
function textoEnvios() {
  const e = state.envios;
  if (!e) return "";
  const lineas = e.tarifas.map((t) =>
    `${t.valor === 0 ? "🛵" : "🚚"} ${t.region}: ${t.valor === 0 ? "GRATIS" : money(t.valor)} — ${t.dias}`
  );
  return lineas.join("\n") + `\n✅ Envío GRATIS en compras desde ${money(e.umbralEnvioGratis)}.`;
}

// Texto de métodos de pago.
function textoPagos() {
  const lineas = [];
  if (state.pago?.habilitado) lineas.push("💳 Tarjeta débito o crédito y PSE (pago seguro con Wompi).");
  lineas.push("🏪 Pago contra entrega (pagas al recibir).");
  lineas.push("💸 Transferencia: Nequi, Daviplata o Bancolombia.");
  return lineas.join("\n");
}

// 5 productos sugeridos (distintos al actual).
function renderSugerencias(skuActual) {
  const cont = $("#pmSugerencias");
  const otros = state.productos.filter((p) => p.sku !== skuActual && p.imagen);
  // barajar y tomar 5
  for (let i = otros.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [otros[i], otros[j]] = [otros[j], otros[i]];
  }
  const cinco = otros.slice(0, 5);
  if (cinco.length === 0) { cont.innerHTML = ""; return; }
  cont.innerHTML =
    `<h3>🛍️ También te puede interesar</h3><div class="pm__sug-grid">` +
    cinco
      .map((p) => `
        <div class="pm__sug" data-sug="${p.sku}">
          <img src="${p.imagen}" alt="${p.nombre}" onerror="this.style.visibility='hidden'">
          <div class="pm__sug__name">${p.nombre}</div>
          <div class="pm__sug__price">${money(p.precio)}</div>
        </div>`)
      .join("") +
    `</div>`;
  cont.querySelectorAll("[data-sug]").forEach((el) =>
    el.addEventListener("click", () => abrirProducto(el.dataset.sug))
  );
}
function cerrarProducto() {
  $("#productModal").classList.remove("open");
  $("#productModal").setAttribute("aria-hidden", "true");
}
function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

// ---------- Carrito ----------
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(state.cart));
}

function addToCart(sku) {
  const p = state.productos.find((x) => x.sku === sku);
  const actual = state.cart[sku] || 0;
  if (p && actual + 1 > p.stock) {
    alert(`Solo quedan ${p.stock} unidades de ${p.nombre}.`);
    return;
  }
  state.cart[sku] = actual + 1;
  saveCart();
  renderGrid();
  renderCart();
  openCart();
}

function setQty(sku, delta) {
  const nuevo = (state.cart[sku] || 0) + delta;
  if (nuevo <= 0) delete state.cart[sku];
  else state.cart[sku] = nuevo;
  saveCart();
  renderGrid();
  renderCart();
}

function removeItem(sku) {
  delete state.cart[sku];
  saveCart();
  renderGrid();
  renderCart();
}

async function getProductoCache(sku) {
  let p = state.productos.find((x) => x.sku === sku);
  if (!p) p = await fetch(`/api/productos/${sku}`).then((r) => r.json());
  return p;
}

async function cartDetallado() {
  const skus = Object.keys(state.cart);
  const items = [];
  for (const sku of skus) {
    const p = await getProductoCache(sku);
    if (p && !p.error) items.push({ ...p, cantidad: state.cart[sku] });
  }
  return items;
}

async function renderCart() {
  const count = Object.values(state.cart).reduce((a, b) => a + b, 0);
  $("#cartCount").textContent = count;

  const items = await cartDetallado();
  const cont = $("#cartItems");
  if (items.length === 0) {
    cont.innerHTML = `<p class="empty">Tu carrito está vacío 🛒</p>`;
    $("#cartFooter").innerHTML = "";
    return;
  }
  cont.innerHTML = items
    .map(
      (p) => `
    <div class="cart__row">
      <div class="cart__thumb" style="background:${p.color}${p.imagen ? `;background-image:url('${p.imagen}');background-size:cover;background-position:center` : ""}"></div>
      <div class="cart__info">
        <b>${p.nombre}</b>
        ${money(p.precio)} c/u
        <div class="qty">
          <button data-minus="${p.sku}">−</button>
          <span>${p.cantidad}</span>
          <button data-plus="${p.sku}">+</button>
          <span style="margin-left:auto;font-weight:700">${money(p.precio * p.cantidad)}</span>
        </div>
        <button class="cart__remove" data-remove="${p.sku}">Eliminar</button>
      </div>
    </div>`
    )
    .join("");

  const subtotal = items.reduce((a, p) => a + p.precio * p.cantidad, 0);
  const faltante = state.envios.umbralEnvioGratis - subtotal;
  $("#cartFooter").innerHTML = `
    <div class="cart__line"><span>Subtotal</span><span>${money(subtotal)}</span></div>
    ${
      faltante > 0
        ? `<div class="cart__line" style="color:var(--teal-dark);font-size:13px"><span>Te faltan ${money(faltante)} para envío gratis</span></div>`
        : `<div class="cart__line" style="color:#1c9c6b;font-size:13px"><span>¡Tienes envío gratis! 🎉</span></div>`
    }
    <button class="btn btn--primary btn--block" id="irCheckout">Continuar compra</button>
  `;

  cont.querySelectorAll("[data-minus]").forEach((b) => b.addEventListener("click", () => setQty(b.dataset.minus, -1)));
  cont.querySelectorAll("[data-plus]").forEach((b) => b.addEventListener("click", () => setQty(b.dataset.plus, +1)));
  cont.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => removeItem(b.dataset.remove)));
  $("#irCheckout").addEventListener("click", abrirCheckout);
}

// ---------- Checkout ----------
async function abrirCheckout() {
  await actualizarResumenCheckout();
  // Prefill con los datos del cliente si tiene sesión
  if (state.cliente?.nombre) $('#checkoutForm [name="nombre"]').value = state.cliente.nombre;
  // Muestra el botón de pago en línea solo si Wompi está configurado
  $("#pagoOnline").hidden = !state.pago.habilitado;
  $("#checkoutModal").classList.add("open");
  $("#checkoutModal").setAttribute("aria-hidden", "false");
}

async function actualizarResumenCheckout() {
  const items = await cartDetallado();
  const subtotal = items.reduce((a, p) => a + p.precio * p.cantidad, 0);
  const region = $("#regionSelect").value;
  const envio = await fetch("/api/envio/cotizar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subtotal, region }),
  }).then((r) => r.json());
  const total = subtotal + envio.valor;
  $("#resumenCheckout").innerHTML = `
    <div class="cart__line"><span>Subtotal (${items.length} productos)</span><span>${money(subtotal)}</span></div>
    <div class="cart__line"><span>Envío</span><span>${envio.gratis ? "GRATIS 🎉" : money(envio.valor)}</span></div>
    <div class="cart__line total"><span>Total</span><span>${money(total)}</span></div>`;
}

async function enviarPedido(e) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const items = Object.entries(state.cart).map(([sku, cantidad]) => ({ sku, cantidad }));
  const payload = {
    items,
    region: fd.get("region"),
    cliente: {
      nombre: fd.get("nombre"),
      telefono: fd.get("telefono"),
      direccion: fd.get("direccion"),
      ciudad: fd.get("ciudad"),
    },
  };
  const res = await fetch("/api/pedidos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || "No se pudo crear el pedido.");
    return;
  }
  // Éxito: limpiar carrito y mostrar confirmación
  state.cart = {};
  saveCart();
  form.reset();
  $("#checkoutModal").classList.remove("open");
  closeCart();
  await cargarProductos();
  renderCart();

  // Mensaje de WhatsApp con TODA la información del pedido.
  const c = data.cliente || {};
  const lineasProductos = data.items
    .map((it) => `• ${it.cantidad} x ${it.nombre} = ${money(it.importe)}`)
    .join("\n");
  const envioTxt = data.envio.gratis
    ? (/(granada)/i.test(data.envio.region || "") ? "GRATIS (domicilio en Granada, Meta) 🛵" : "GRATIS 🎉")
    : `${money(data.envio.valor)} (${data.envio.region})`;
  const formaPago = fd.get("formaPago") || "Pago contra entrega";
  const mensaje =
    `🛒 *NUEVO PEDIDO #${data.numero}* — ${state.tienda.nombre}\n\n` +
    `*Productos:*\n${lineasProductos}\n\n` +
    `Subtotal: ${money(data.subtotal)}\n` +
    `Envío: ${envioTxt}\n` +
    `*TOTAL A PAGAR: ${money(data.total)}*\n\n` +
    `💳 *Forma de pago:* ${formaPago}\n\n` +
    `*Datos de entrega:*\n` +
    `👤 ${c.nombre || "-"}\n` +
    `📱 ${c.telefono || "-"}\n` +
    `📍 ${c.direccion || "-"}, ${c.ciudad || "-"}\n` +
    `🚚 Zona: ${data.region || "-"}\n\n` +
    `🌐 Tienda: ${state.publicUrl}\n` +
    `Quiero coordinar el pago y la entrega. ¡Gracias!`;
  const waText = encodeURIComponent(mensaje);
  $("#okContent").innerHTML = `
    <h2 style="color:var(--teal-deep)">¡Pedido confirmado! 🎉</h2>
    <p>Tu número de pedido es <b>#${data.numero}</b>.</p>
    <p>Total: <b>${money(data.total)}</b> (envío ${data.envio.gratis ? "gratis" : money(data.envio.valor)}).</p>
    <p style="font-size:13px;color:var(--muted)">Toca el botón para enviarnos tu pedido con todos los datos por WhatsApp 👇</p>
    <a class="btn btn--primary btn--block" style="text-decoration:none;display:block;margin-bottom:10px"
       href="https://wa.me/${state.tienda.whatsapp}?text=${waText}" target="_blank" rel="noopener">
       Enviar pedido por WhatsApp 💬
    </a>`;
  $("#okModal").classList.add("open");
}

// ---------- Cuenta de cliente ----------
function renderCuenta() {
  const label = $("#accountLabel");
  if (state.cliente) label.textContent = (state.cliente.nombre || state.cliente.email).split(" ")[0];
  else label.textContent = "Ingresar";
}

let authTab = "login";
function abrirAuth() {
  if (state.cliente) {
    // Ya tiene sesión: ofrecer cerrar sesión
    if (confirm(`Sesión de ${state.cliente.email}. ¿Cerrar sesión?`)) {
      state.cliente = null;
      localStorage.removeItem("gr_cliente");
      localStorage.removeItem("gr_cliente_token");
      renderCuenta();
    }
    return;
  }
  setAuthTab("login");
  $("#authMsg").className = "auth-msg";
  $("#authForm").reset();
  $("#authModal").classList.add("open");
  $("#authModal").setAttribute("aria-hidden", "false");
}
function cerrarAuth() {
  $("#authModal").classList.remove("open");
  $("#authModal").setAttribute("aria-hidden", "true");
}
function setAuthTab(tab) {
  authTab = tab;
  document.querySelectorAll(".auth-tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  $("#authTitle").textContent = tab === "login" ? "Ingresar" : "Crear cuenta";
  $("#authSubmit").textContent = tab === "login" ? "Ingresar" : "Registrarme";
  $("#fldNombre").style.display = tab === "login" ? "none" : "";
  $("#fldPublicidad").style.display = tab === "login" ? "none" : "";
}
async function enviarAuth(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const msg = $("#authMsg");
  const ruta = authTab === "login" ? "/api/clientes/login" : "/api/clientes/registro";
  const body = {
    email: fd.get("email"),
    password: fd.get("password"),
    nombre: fd.get("nombre"),
    aceptaPublicidad: fd.get("aceptaPublicidad") === "on",
  };
  const res = await fetch(ruta, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) { msg.className = "auth-msg err"; msg.textContent = data.error || "Error"; return; }
  state.cliente = data.cliente;
  localStorage.setItem("gr_cliente", JSON.stringify(data.cliente));
  localStorage.setItem("gr_cliente_token", data.token);
  renderCuenta();
  cerrarAuth();
}

// ---------- Pago en línea (Wompi) ----------
async function pagarEnLinea() {
  const items = Object.entries(state.cart).map(([sku, cantidad]) => ({ sku, cantidad }));
  if (!items.length) { alert("Tu carrito está vacío."); return; }

  // Exige los datos de entrega (para saber a dónde despachar).
  const form = $("#checkoutForm");
  if (!form.reportValidity()) return;
  const fd = new FormData(form);
  const region = fd.get("region");

  const res = await fetch("/api/pago/preparar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, region }),
  });
  const data = await res.json();
  if (!res.ok) { alert(data.error || "No se pudo iniciar el pago."); return; }

  // Redirige al Checkout seguro de Wompi (procesa PSE y tarjetas), enviando
  // los datos del cliente y la dirección de entrega para que queden con el pago.
  const url = new URL("https://checkout.wompi.co/p/");
  url.searchParams.set("public-key", data.publicKey);
  url.searchParams.set("currency", data.currency);
  url.searchParams.set("amount-in-cents", data.amountInCents);
  url.searchParams.set("reference", data.reference);
  url.searchParams.set("signature:integrity", data.signature);
  url.searchParams.set("redirect-url", state.publicUrl || window.location.origin);
  url.searchParams.set("customer-data:full-name", fd.get("nombre") || "");
  url.searchParams.set("customer-data:phone-number", fd.get("telefono") || "");
  if (state.cliente?.email) url.searchParams.set("customer-data:email", state.cliente.email);
  url.searchParams.set("shipping-address:address-line-1", fd.get("direccion") || "");
  url.searchParams.set("shipping-address:city", fd.get("ciudad") || "");
  url.searchParams.set("shipping-address:region", region || "");
  url.searchParams.set("shipping-address:name", fd.get("nombre") || "");
  url.searchParams.set("shipping-address:phone-number", fd.get("telefono") || "");
  url.searchParams.set("shipping-address:country", "CO");
  window.location.href = url.toString();
}

// ---------- UI ----------
function openCart() {
  $("#cart").classList.add("open");
  $("#overlay").classList.add("show");
  $("#cart").setAttribute("aria-hidden", "false");
}
function closeCart() {
  $("#cart").classList.remove("open");
  $("#overlay").classList.remove("show");
  $("#cart").setAttribute("aria-hidden", "true");
}

function bindEvents() {
  $("#abrirCarrito").addEventListener("click", openCart);
  $("#cerrarCarrito").addEventListener("click", closeCart);
  $("#overlay").addEventListener("click", closeCart);
  $("#cerrarCheckout").addEventListener("click", () => $("#checkoutModal").classList.remove("open"));
  $("#cerrarOk").addEventListener("click", () => $("#okModal").classList.remove("open"));
  $("#checkoutForm").addEventListener("submit", enviarPedido);
  $("#regionSelect").addEventListener("change", actualizarResumenCheckout);
  $("#pagarWompi").addEventListener("click", pagarEnLinea);

  // Detalle de producto
  $("#cerrarProducto").addEventListener("click", cerrarProducto);
  $("#productModal").addEventListener("click", (e) => { if (e.target.id === "productModal") cerrarProducto(); });

  // Versículo flotante (cerrar)
  const verseClose = document.getElementById("verseClose");
  if (verseClose) verseClose.addEventListener("click", () => document.getElementById("verse").classList.add("hidden"));

  // Contacto / servicio al cliente
  $("#contactoBtn").addEventListener("click", abrirContacto);
  $("#cerrarContacto").addEventListener("click", cerrarContacto);
  $("#contactModal").addEventListener("click", (e) => { if (e.target.id === "contactModal") cerrarContacto(); });

  // Cuenta de cliente
  $("#accountBtn").addEventListener("click", abrirAuth);
  $("#cerrarAuth").addEventListener("click", cerrarAuth);
  $("#authForm").addEventListener("submit", enviarAuth);
  document.querySelectorAll(".auth-tab").forEach((b) => b.addEventListener("click", () => setAuthTab(b.dataset.tab)));

  let t;
  $("#buscar").addEventListener("input", (e) => {
    clearTimeout(t);
    t = setTimeout(() => {
      state.busqueda = e.target.value.trim();
      state.categoriaActiva = null;
      syncChips();
      cargarProductos();
    }, 250);
  });
}

init();
