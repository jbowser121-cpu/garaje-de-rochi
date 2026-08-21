# Activar pago con tarjeta / PSE (Wompi)

> ## ⛔ HOY ESTÁ DESACTIVADO
>
> La tienda ya **no** cobra en línea. Toda compra se cierra por **WhatsApp**: el cliente llena
> sus datos, escoge *contra entrega* o *transferencia*, y al confirmar se abre tu WhatsApp con
> el pedido completo. Si escoge transferencia, tú le pasas ahí el número de cuenta. Así no se
> paga la comisión de la pasarela.
>
> **Para volver a activarlo** (todo el código del servidor sigue en su sitio):
>
> 1. En `public/index.html`, dentro de `#checkoutForm`, volver a poner el bloque justo después
>    del `#resumenCheckout`:
>    `<div id="pagoOnline" class="pago-online" hidden><button type="button" class="btn btn--pay btn--block" id="pagarWompi">💳 Pagar en línea (PSE / Tarjeta)</button><p class="pago-online__nota">Pago seguro procesado por Wompi 🔒</p><div class="pago-sep"><span>o</span></div></div>`
> 2. En `public/app.js`, volver a poner la función `pagarEnLinea()`, su línea en `bindEvents()`
>    (`$("#pagarWompi").addEventListener("click", pagarEnLinea);`), el `state.pago` y la línea
>    de `#pagoOnline` en `abrirCheckout()`. Está todo en el commit que lo quitó (`git show`).
> 3. Las llaves `WOMPI_PUBLIC_KEY` y `WOMPI_INTEGRITY_SECRET` siguen puestas en Vercel.
>
> Lo que sigue abajo es la guía original, por si se reactiva.

---

El código ya está listo. Solo faltan tus llaves de Wompi. Sigue estos pasos.

## PASO 1 — Crear la cuenta de comercio (una vez)
1. Entra a **https://comercios.wompi.co** → **Regístrate**.
2. Completa los datos de tu negocio (puedes empezar como persona natural).
3. **Vincula tu cuenta bancaria**: ahí es donde Wompi te consigna el dinero de las ventas.

## PASO 2 — Copiar tus llaves
1. Dentro de Wompi, ve a **Ajustes** (o Configuración) → **Llaves API**.
2. Verás dos ambientes: **Sandbox** (pruebas) y **Producción** (dinero real).
   - Para **probar** primero: usa las de **Sandbox** (empiezan por `pub_test_`).
   - Para **cobrar de verdad**: usa las de **Producción** (`pub_prod_`), disponibles cuando Wompi apruebe tu cuenta.
3. Necesitas copiar **2 datos** del mismo ambiente:
   - **Llave pública** (`pub_test_...` o `pub_prod_...`)
   - **Secreto de integridad** (Integrity)  ← NO es la llave privada.

## PASO 3 — Pegar las llaves en Vercel
1. En **vercel.com** → tu proyecto **garaje-de-rochi** → **Settings** → **Environment Variables**.
2. Agrega estas 2 (Key = nombre, Value = lo que copiaste):

   | Key | Value |
   |-----|-------|
   | `WOMPI_PUBLIC_KEY` | tu llave pública (pub_test_... o pub_prod_...) |
   | `WOMPI_INTEGRITY_SECRET` | tu secreto de integridad |

3. Guarda, ve a **Deployments** → **···** → **Redeploy**.

## PASO 4 — Listo
En el checkout aparecerá el botón **"💳 Pagar en línea (PSE / Tarjeta)"**.
El cliente paga en la página segura de Wompi (tarjeta, PSE, etc.), con la dirección de
entrega incluida, y el dinero llega a tu cuenta bancaria. Ves cada venta en tu panel de Wompi.

> Recomendación: prueba primero con las llaves **Sandbox** (pagos simulados) para ver que todo
> funciona, y luego cambia a las de **Producción**.
