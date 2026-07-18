# Publicar El Garaje de Rochi en internet (24/7) con Vercel

Usa tus cuentas actuales: **GitHub** (jbowser121-cpu) y **Vercel**. Es un proyecto NUEVO,
independiente de la bitácora.

## PASO 1 — Crear el repositorio en GitHub (2 min)
1. Entra a https://github.com (ya estás con tu cuenta).
2. Arriba a la derecha: botón **+** → **New repository**.
3. **Repository name:** `garaje-de-rochi`  (¡exactamente así!)
4. Déjalo en **Public**. **NO** marques "Add a README".
5. Clic en **Create repository**.

## PASO 2 — Subir el código (1 comando)
En la terminal, dentro de la carpeta del proyecto, ejecuta:

```bash
git push -u origin main
```

Si pide iniciar sesión, se abre el navegador → confirmas con tu cuenta de GitHub.
(El repositorio remoto ya quedó configurado.)

## PASO 3 — Crear el proyecto en Vercel (3 min)
1. Entra a https://vercel.com (con tu cuenta).
2. **Add New…** → **Project**.
3. En *Import Git Repository*, busca **garaje-de-rochi** → **Import**.
   (Es un proyecto NUEVO, separado de mibitacora-com-co.)
4. En *Configure Project* → **Environment Variables**, agrega estas 3:

   | Name | Value |
   |------|-------|
   | `ADMIN_USER` | jbowser121@gmail.com |
   | `ADMIN_PASS` | (la clave que quieras para tu panel) |
   | `PUPPETEER_SKIP_DOWNLOAD` | true |

5. Clic en **Deploy**. Espera 1–2 minutos.
6. Al terminar te da la URL, algo como `https://garaje-de-rochi.vercel.app`.

## PASO 4 — Fijar el link definitivo
1. En Vercel → tu proyecto → **Settings** → **Environment Variables**.
2. Agrega: `PUBLIC_URL` = la URL que te dio (ej. `https://garaje-de-rochi.vercel.app`).
3. Ve a **Deployments** → en el último, menú **···** → **Redeploy**.
4. ✅ Listo: esa dirección es **fija, 24/7 y funciona desde cualquier dispositivo**.

## PASO 5 — Actualizar el bot y las redes
- En el archivo `.env` de tu computador, cambia `PUBLIC_URL` por la URL de Vercel y reinicia el bot,
  para que los mensajes lleven ese link.
- Pon esa misma URL en la **bio de Instagram/Telegram**.

---

## ⚠️ Importante (persistencia de datos)
Vercel es "serverless": el catálogo, precios y fotos van en el código y se ven perfecto 24/7.
PERO los **registros de clientes** y los **cambios de precio desde el panel** NO se guardan de forma
permanente en Vercel (se reinician). Para que eso quede guardado se conecta **Supabase** (tu cuenta)
como base de datos. Es un segundo paso que se puede hacer después.

### Cómo cambiar precios mientras tanto
Edita `server/data/seed.js` (precios) o `server/data/imagenes.js` (fotos), guarda, y:
```bash
git add -A && git commit -m "Actualizar precios" && git push
```
Vercel vuelve a publicar solo en ~1 minuto.
