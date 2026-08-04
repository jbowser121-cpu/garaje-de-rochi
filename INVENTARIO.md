# Manejar el inventario desde Excel — El Garaje de Rochi

El archivo **`inventario.xlsx`** (en esta carpeta) controla la página web.
Cambias ahí precios y existencias, y con un doble clic la tienda queda actualizada.

## El día a día

1. Abre **`inventario.xlsx`** (o el acceso directo **1 - Inventario Garaje** del Escritorio)
2. Cambia lo que necesites en las **columnas amarillas**
3. **Guarda** (Ctrl+S) y **cierra** el Excel
4. Doble clic en **`Actualizar-pagina.bat`** (acceso **2 - Actualizar pagina Garaje**)
5. Sale ✅ y la web se actualiza sola en menos de un minuto

### Modo automático

Abre una vez el acceso **3 - Actualizacion automatica Garaje** y minimiza esa ventana.
De ahí en adelante, cada vez que guardes y cierres el Excel la página se publica sola.
Mientras el Excel siga abierto no toca nada: espera a que lo cierres.

## Las columnas

| Columna | Se edita | Qué hace |
|---|---|---|
| Producto, Marca, Categoría | ❌ | Para que sepas de qué fila se trata |
| **Precio** | ✅ | En pesos, sin puntos ni `$`: escribe `170000` |
| **Cantidad** | ✅ | Unidades que tienes. `0` = "Agotado por el momento" y no se puede comprar |
| **Mostrar en la web** | ✅ | `SI` aparece · `NO` la esconde de la tienda (el panel de moderador la sigue viendo) |
| Estado | ❌ | Se calcula solo |
| SKU | ❌ | El código del producto. Si lo borras, esa fila se ignora |

## Convive con las carpetas de fotos

Antes las cantidades se manejaban con el `cantidad.txt` de cada carpeta de
`Descargas\fotos-garaje-de-rochi`, y eso corre solo al prender el computador.

**Los dos sistemas siguen funcionando y no se pisan:** cuando actualizas desde el Excel,
los `cantidad.txt` se reescriben con los mismos números. Así, cuando prendas el PC y corra
el programa viejo, va a leer exactamente lo mismo que pusiste en el Excel y no revierte nada.

Puedes usar el que quieras, pero lo cómodo es el Excel: ahí también manejas **precios** y
**qué se muestra**, que las carpetas no controlan.

## Dónde queda cada cosa

| Archivo | Qué guarda |
|---|---|
| `inventario.xlsx` | Lo que tú editas |
| `server/data/inventario.js` | Las cantidades (generado) |
| `server/data/ajustes.js` | Precios y visibilidad (generado) |
| `Descargas\fotos-garaje-de-rochi\...\cantidad.txt` | Copia de las cantidades (sincronizada) |

Los tres últimos se generan solos. **No los edites a mano.**

## Ver los cambios sin publicar

```bash
node "C:/Users/omarc/Downloads/clode/scripts/actualizar-desde-excel.mjs" --probar
```

Muestra el informe completo y no escribe ni publica nada.

## Agregar productos nuevos

No se puede desde el Excel: hacen falta las fotos. Pídelo con las fotos, se agregan al
catálogo, y después corres `Regenerar-excel.bat` para que aparezcan en tu Excel.

## Reglas

- No borres filas ni cambies el orden → para quitar algo usa `Mostrar en la web = NO`
- No le cambies el nombre a la hoja "Inventario"
- El Excel tiene que estar **cerrado** cuando corras el `.bat`
