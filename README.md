# NutriVida 🌿 — Tienda de Vitaminas y Suplementos

Proyecto completo de e-commerce para vender vitaminas y suplementos por **página web, WhatsApp e Instagram**, con:

- 🛒 **Tienda web** con carrito de compras, precios en COP y control de existencias.
- 📦 **Inventario real**: el stock se descuenta al confirmar un pedido.
- 🚚 **Envíos a nivel nacional** con tarifas por región y envío gratis sobre un monto.
- 🤖 **Bot autónomo de WhatsApp** (responde precios, disponibilidad y envíos).
- 🤖 **Bot autónomo de Instagram** (DMs vía API oficial de Meta).

Todos los bots comparten el mismo "cerebro" (`bots/brain.js`), así responden igual en los dos canales.

---

## 1. Requisitos

- [Node.js](https://nodejs.org) 18 o superior (probado en Node 24).

## 2. Instalación

```bash
npm install
cp .env.example .env   # en Windows PowerShell: copy .env.example .env
```

## 3. Ejecutar la tienda web

```bash
npm start
```

Abre **http://localhost:3000** 🎉

- Cambia el catálogo, precios y stock en [`server/data/seed.js`](server/data/seed.js).
- Al hacer el primer arranque se genera `server/data/store.json` (la "base de datos").
  Bórralo para reiniciar el inventario a los valores del seed.

### Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/tienda` | Info, categorías y tarifas de envío |
| GET | `/api/productos?categoria=&buscar=` | Catálogo con filtros |
| GET | `/api/productos/:sku` | Detalle de un producto |
| POST | `/api/envio/cotizar` | Cotiza envío (`{subtotal, region}`) |
| POST | `/api/pedidos` | Crea pedido y descuenta stock |
| GET | `/api/pedidos/:numero` | Consulta un pedido |

## 4. Bot de WhatsApp (autónomo, sin costo de API)

```bash
npm install whatsapp-web.js qrcode-terminal   # solo la primera vez
npm run bot:whatsapp
```

1. Aparece un **código QR** en la terminal.
2. Ábrelo desde el WhatsApp del negocio: **Ajustes → Dispositivos vinculados → Vincular dispositivo**.
3. Listo: el bot responde solo a los chats directos.

> Usa un número propio del negocio. whatsapp-web.js automatiza WhatsApp Web; respeta los términos de uso de WhatsApp y evita envíos masivos no solicitados.

## 5. Bot de Instagram (API oficial de Meta)

Instagram no permite librerías no oficiales estables, así que se usa la **API oficial** con un webhook.

Pasos (una sola vez):

1. Convierte tu cuenta de Instagram en **Profesional** (Business/Creator) y vincúlala a una **Página de Facebook**.
2. Crea una app en <https://developers.facebook.com> con los productos **Instagram** y **Messenger**.
3. Consigue el **Page Access Token** y define un **Verify Token** (invéntalo). Ponlos en `.env`:
   ```
   IG_PAGE_ACCESS_TOKEN=EAAG...
   IG_VERIFY_TOKEN=nutrivida_verify
   ```
4. Arranca el webhook y exponlo con HTTPS (ej. [ngrok](https://ngrok.com)):
   ```bash
   npm run bot:instagram
   npx ngrok http 3100      # en otra terminal
   ```
5. En la app de Meta, registra el webhook con la URL `https://XXXX.ngrok.io/webhook` y tu Verify Token,
   y suscríbete al evento **messages**.

## 6. Estructura del proyecto

```
clode/
├── server/
│   ├── index.js          API + sirve el frontend
│   ├── db.js             Persistencia (JSON) + inventario y pedidos
│   └── data/
│       ├── seed.js       Catálogo, categorías y tarifas de envío  ← EDITA AQUÍ
│       └── store.json    Se genera solo (datos vivos)
├── public/               Tienda web (HTML/CSS/JS)
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── bots/
│   ├── brain.js          Cerebro compartido de respuestas
│   ├── whatsapp.js       Bot de WhatsApp (QR)
│   └── instagram.js      Bot de Instagram (webhook Meta)
├── .env.example
└── package.json
```

## 7. Próximos pasos sugeridos

- 💳 **Pasarela de pago** (Wompi, Mercado Pago, PayU) en el checkout.
- 🖼️ Reemplazar los placeholders de color por **fotos reales** de producto.
- 🔐 **Panel de administración** para editar stock y ver pedidos.
- 🧠 Conectar el cerebro del bot a **Claude** para respuestas más naturales (ver comentario final en `bots/brain.js`).
- ☁️ Desplegar en un servidor (Railway, Render, VPS) con base de datos real (SQLite/Postgres).

---

_Los suplementos no reemplazan una dieta equilibrada ni tratamiento médico. Ajusta los textos legales/sanitarios según la normativa de tu país (en Colombia, INVIMA)._
