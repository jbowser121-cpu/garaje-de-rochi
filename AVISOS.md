# Que cada pedido te llegue al celular, sí o sí

Antes el pedido solo te llegaba si el cliente presionaba el botón verde. Si cerraba la
página, te quedabas sin saber a dónde enviar. **Eso ya está resuelto**: ahora el aviso
lo manda **el servidor**, no el navegador del cliente.

## Qué avisa y cuándo

| Momento | Qué te llega | ¿Depende del cliente? |
|---|---|---|
| El cliente confirma el pedido | Productos, total, entrega, nombre, celular, cédula, dirección y ciudad | **No** |
| El cliente presiona el botón verde | El mismo resumen a tu WhatsApp | Sí (queda como segundo respaldo) |

> El pago en línea con Wompi está desactivado (ver `WOMPI.md`), así que ya no hay aviso de
> "PAGO APROBADO": el pago se acuerda contigo por WhatsApp (contra entrega solo en Granada,
> Meta; transferencia para el resto del país)
> y tú lo confirmas. El **PASO 2** de más abajo (webhook de Wompi) solo aplica si algún día
> se vuelve a activar.

**Y si todos los canales fallan**, el pedido igual queda escrito en los registros del
servidor: Vercel → tu proyecto → pestaña **Logs**. Nunca se pierde.

---

# PASO 1 — Activar el aviso al celular (5 minutos, gratis)

## Se usa Telegram, no WhatsApp. Por qué

Para que un programa te escriba al WhatsApp hace falta un intermediario. El gratuito
(**CallMeBot**) **cerró los registros nuevos** en agosto de 2026: responde *"Este bot está lleno"*.
Las alternativas de WhatsApp o cobran mensualidad, o piden conectar tu WhatsApp a una
empresa desconocida.

**Telegram es gratis, oficial, instantáneo y no depende de nadie.** Te llega la notificación al
celular igual que un WhatsApp. Es una app aparte que instalas una vez.

> Si CallMeBot vuelve a abrir, el código ya lo soporta: solo agregas `AVISO_WHATSAPP` y
> `CALLMEBOT_APIKEY` y empieza a llegarte también por WhatsApp, sin tocar nada más.

## Los pasos

**1.1.** Instala **Telegram** en tu celular (Play Store / App Store) y regístrate con tu número.

**1.2.** En el buscador de Telegram escribe **@BotFather** y ábrelo (tiene sello azul de
verificado).

**1.3.** Toca **INICIAR** (o escribe `/start`).

**1.4.** Escribe: `/newbot`

**1.5.** Te pide un **nombre**. Escribe: `Pedidos Garaje de Rochi`

**1.6.** Te pide un **usuario** que debe terminar en `bot` y ser único. Prueba con:
`pedidos_garaje_rochi_2026_bot` (si dice que ya existe, cámbiale el número).

**1.7.** Te responde con un texto que dice **"Use this token to access the HTTP API:"** y debajo
una clave larga tipo `8123456789:AAF...`. **Cópiala y guárdala.** Ese es el `TELEGRAM_BOT_TOKEN`.

**1.8.** Ahora hay que decirle a qué chat escribir. En el buscador de Telegram escribe
**@userinfobot**, ábrelo y toca **INICIAR**.

**1.9.** Te responde con tu **Id**: un número tipo `123456789`. Ese es el `TELEGRAM_CHAT_ID`.
Cópialo.

**1.10.** 🔴 **Paso que todo el mundo olvida:** busca **tu propio bot** en Telegram (el usuario que
inventaste en 1.6, por ejemplo `@pedidos_garaje_rochi_2026_bot`), ábrelo y toca **INICIAR**.
Telegram no deja que un bot te escriba si tú no le hablaste primero.

**1.11.** Entra a `https://vercel.com/mibitacora/garaje-de-rochi/settings/environment-variables`
y agrega **dos** variables (igual que hiciste con `PUBLIC_URL`):

| Key | Value |
|---|---|
| `TELEGRAM_BOT_TOKEN` | la clave larga del paso 1.7 |
| `TELEGRAM_CHAT_ID` | el número del paso 1.9 |

**1.12.** **Deployments → ··· → Redeploy**.

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

### Correo electrónico (buen respaldo)

Sirve para tener el pedido por escrito aunque pierdas el celular.

1. Crea cuenta gratis en **https://resend.com** → **API Keys** → copia la clave
2. En Vercel: `RESEND_API_KEY` y `AVISO_EMAIL` (tu correo)

### WhatsApp (cuando CallMeBot vuelva a abrir)

Revisa cada tanto en **https://www.callmebot.com/blog/free-api-whatsapp-messages/** si ya
permiten registros nuevos. Cuando abran:

1. Guarda el número que indiquen ahí y mándale `I allow callmebot to send me messages`
2. En Vercel: `AVISO_WHATSAPP` (tu número con 57, sin `+`) y `CALLMEBOT_APIKEY`

No hay que cambiar nada del programa: apenas existan esas dos variables, el aviso empieza a
llegarte **también** por WhatsApp, además de Telegram.

> Hay otros servicios que sí mandan WhatsApp hoy (Green API, UltraMsg, Whapi y parecidos),
> pero cobran mensualidad pasado el plan de prueba y piden conectar tu cuenta de WhatsApp a
> un tercero escaneando un QR. Eso les da acceso a tus conversaciones. No te lo recomiendo
> mientras Telegram haga el trabajo gratis.

---

# Comprobar que quedó funcionando

Haz un pedido de prueba en la tienda con cualquier producto barato. Al confirmar, debe
llegarte la notificación a Telegram en menos de un minuto.

Si no llega, mira en Vercel → **Logs**: ahí sale el pedido completo y, si un canal falló,
el motivo exacto.

---

## Sobre la privacidad de tus clientes

Los avisos llevan nombre, celular, cédula y dirección de quien compra. Al activar Telegram
o Resend, esos datos pasan por ese servicio para llegarte a ti. Es lo mismo que pasa cuando
el pedido te llega por WhatsApp normal, pero es bueno que lo sepas.
Si prefieres que no salgan a ningún tercero, deja los canales apagados y revisa los
pedidos en los **Logs** de Vercel.
