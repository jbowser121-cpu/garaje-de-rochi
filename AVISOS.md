# Que cada pedido te llegue al WhatsApp, sí o sí

Antes el pedido solo te llegaba si el cliente presionaba el botón verde. Si cerraba la
página, te quedabas sin saber a dónde enviar. **Eso ya está resuelto**: ahora el aviso
lo manda **el servidor**, no el navegador del cliente.

## Qué avisa y cuándo

| Momento | Qué te llega | ¿Depende del cliente? |
|---|---|---|
| El cliente confirma el pedido | Productos, total, entrega, nombre, celular, cédula, dirección y ciudad | **No** |
| Wompi aprueba el pago | PAGO APROBADO con monto, medio de pago, referencia y de nuevo la dirección | **No** — Wompi le habla directo al servidor |
| El cliente presiona el botón verde | El mismo resumen a tu WhatsApp | Sí (queda como tercer respaldo) |

O sea: te llega **dos veces** en los pagos en línea (uno al confirmar y otro al aprobarse
el pago). Es a propósito: mejor repetido que perdido.

**Y si todos los canales fallan**, el pedido igual queda escrito en los registros del
servidor: Vercel → tu proyecto → pestaña **Logs**. Nunca se pierde.

---

# PASO 1 — Activar el WhatsApp (5 minutos, gratis)

Se usa **CallMeBot**, un servicio gratuito que permite que un programa te escriba a *tu propio*
WhatsApp.

**1.1.** Guarda este número en tus contactos: **+34 644 51 95 23** (ponle "CallMeBot").

**1.2.** Desde el WhatsApp del número donde quieres recibir los pedidos, mándale
**este texto exacto**:

```
I allow callmebot to send me messages
```

**1.3.** En unos segundos te responde con tu **API key** (algo como `123456`). Cópiala.

**1.4.** Entra a `https://vercel.com/mibitacora/garaje-de-rochi/settings/environment-variables`
y agrega **dos** variables (igual que hiciste con `PUBLIC_URL`):

| Key | Value |
|---|---|
| `AVISO_WHATSAPP` | `573144503681` (el número, con 57 y sin `+` ni espacios) |
| `CALLMEBOT_APIKEY` | la clave que te mandó CallMeBot |

**1.5.** **Deployments → ··· → Redeploy**.

---

# PASO 2 — Conectar el aviso de pagos de Wompi

Esto es lo que hace que un pago aprobado te llegue **aunque el cliente cierre todo**.

**2.1.** Entra a **https://comercios.wompi.co** → **Ajustes** → **Eventos** (o *Webhooks*).

**2.2.** En la URL de eventos pon exactamente:

```
https://garaje-de-rochi-xi.vercel.app/api/wompi/webhook
```

**2.3.** Guarda. Wompi te muestra un **Secreto de eventos** (empieza por `prod_events_` o
`test_events_`). Cópialo.

**2.4.** En Vercel agrega una variable más:

| Key | Value |
|---|---|
| `WOMPI_EVENTS_SECRET` | el secreto de eventos |

**2.5.** **Redeploy** otra vez.

> El secreto sirve para comprobar que el aviso viene de verdad de Wompi. Sin él el aviso
> igual funciona, pero cualquiera podría mandarte un mensaje falso de "pago aprobado".
> **Ponlo.**

---

# Otros canales (opcionales)

Puedes tener varios a la vez. Si uno falla, los otros siguen funcionando.

### Telegram (el más confiable de todos)

CallMeBot es un servicio gratuito de un tercero: funciona bien, pero no tiene garantía.
Telegram es oficial y gratis. Si quieres doble seguridad:

1. En Telegram busca **@BotFather** → `/newbot` → te da un **token**
2. Escríbele a tu bot cualquier cosa, y busca **@userinfobot** para saber tu **chat id**
3. En Vercel: `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`

### Correo electrónico

1. Crea cuenta gratis en **https://resend.com** → **API Keys** → copia la clave
2. En Vercel: `RESEND_API_KEY` y `AVISO_EMAIL` (tu correo)

---

# Comprobar que quedó funcionando

Haz un pedido de prueba en la tienda con cualquier producto barato. Al confirmar, debe
llegarte el mensaje al WhatsApp en menos de un minuto.

Si no llega, mira en Vercel → **Logs**: ahí sale el pedido completo y, si un canal falló,
el motivo exacto.

---

## Sobre la privacidad de tus clientes

Los avisos llevan nombre, celular, cédula y dirección de quien compra. Al activar CallMeBot,
Telegram o Resend, esos datos pasan por ese servicio para llegarte a ti. Es lo mismo que
pasa cuando el pedido te llega por WhatsApp normal, pero es bueno que lo sepas.
Si prefieres que no salgan a ningún tercero, deja los canales apagados y revisa los
pedidos en los **Logs** de Vercel.
