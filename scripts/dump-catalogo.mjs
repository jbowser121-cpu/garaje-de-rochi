// Imprime el catálogo de la página (nombre + precio) como JSON, ordenado alfabéticamente.
// Lo usa sincronizar_ventas_garaje.py para llenar el Excel de ventas.
import { productos } from "../server/data/seed.js";
const out = productos
  .map((p) => ({ nombre: p.nombre, precio: p.precio }))
  .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
process.stdout.write(JSON.stringify(out));
