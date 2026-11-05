# -*- coding: utf-8 -*-
# Sincroniza la hoja "Productos" del Excel de ventas (fiados) con el catálogo de la página.
# Reconstruye los nombres + precios y ajusta el rango nombrado ListaProductos
# (que alimenta el desplegable). NO toca las demás hojas (Fiados, Resumen, etc.).
# Uso:  python sincronizar_ventas_garaje.py <ruta_catalogo.json>
import openpyxl, os, sys, json, io
from copy import copy
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

RUTA = r"C:\Users\omarc\Downloads\fotos-garaje-de-rochi\Ventas a Credito - El Garaje de Rochi.xlsx"
CAT = sys.argv[1] if len(sys.argv) > 1 else None
if not CAT or not os.path.exists(CAT):
    print("Falta el archivo de catálogo (JSON)."); sys.exit(1)

lock = os.path.join(os.path.dirname(RUTA), "~$" + os.path.basename(RUTA))
if os.path.exists(lock):
    print("*** CIERRA el Excel de ventas y vuelve a intentar. ***"); sys.exit(1)

prods = json.load(open(CAT, encoding="utf-8"))
wb = openpyxl.load_workbook(RUTA)
if "Productos" not in wb.sheetnames:
    print("No existe la hoja 'Productos' en el Excel de ventas."); sys.exit(1)
wp = wb["Productos"]

# Estilos de la fila 2 como plantilla.
tpl = {c: (copy(wp.cell(2, c).font), copy(wp.cell(2, c).fill), copy(wp.cell(2, c).border),
           wp.cell(2, c).number_format, copy(wp.cell(2, c).alignment)) for c in (1, 2)}

r = 2
for p in prods:
    wp.cell(r, 1, p["nombre"]); wp.cell(r, 2, p["precio"])
    for c in (1, 2):
        f, fi, b, nf, al = tpl[c]
        cell = wp.cell(r, c)
        cell.font = copy(f); cell.fill = copy(fi); cell.border = copy(b)
        cell.number_format = nf; cell.alignment = copy(al)
    r += 1
last = r - 1

# Limpia filas sobrantes hasta la 49 (sin tocar la nota de la fila 50).
for rr in range(r, 50):
    wp.cell(rr, 1).value = None; wp.cell(rr, 2).value = None

# Rango nombrado ListaProductos -> A2:A{last}
ref = f"Productos!$A$2:$A${last}"
dn = wb.defined_names
if "ListaProductos" in dn:
    dn["ListaProductos"].value = ref
else:
    from openpyxl.workbook.defined_name import DefinedName
    dn.add(DefinedName("ListaProductos", attr_text=ref))

try: wb.calculation.fullCalcOnLoad = True
except Exception: pass
wb.save(RUTA)
print(f"OK: {len(prods)} productos sincronizados en el Excel de ventas (filas 2-{last}).")
