// Catálogo de El Garaje de Rochi. Precios en COP (pesos colombianos).
// Las imágenes se cargan como URL (fondo blanco); si falta, se muestra un color de marca.
import { imagenesProductos } from "./imagenes.js";
import { descripcionesProductos } from "./descripciones.js";
import { inventario } from "./inventario.js";

export const categorias = [
  { id: "suplementos", nombre: "Suplementos" },
  { id: "vitaminas-minerales", nombre: "Vitaminas & Minerales" },
  { id: "cuidado-personal", nombre: "Cuidado Personal" },
  { id: "ninos", nombre: "Niños" },
];

export const productos = [
  {
    sku: "VM-MAGCIT-180",
    nombre: "Nature Made Magnesio Citrato 250 mg (180 softgels)",
    categoria: "vitaminas-minerales",
    marca: "Nature Made",
    precio: 170000,
    stock: 20,
    color: "#3b7a57",
    descripcion: "Magnesio citrato de 250 mg. Apoya la función muscular y nerviosa. 180 cápsulas blandas.",
    destacado: true,
  },
  {
    sku: "VM-MAGGLY-180",
    nombre: "Nature's Bounty Magnesio Glicinato 240 mg (180 cápsulas)",
    categoria: "vitaminas-minerales",
    marca: "Nature's Bounty",
    precio: 130000,
    stock: 20,
    color: "#2f7d73",
    descripcion: "Magnesio glicinato de alta absorción. Apoya músculos, huesos y sistema nervioso.",
    destacado: false,
  },
  {
    sku: "CP-HSN-ADV-230",
    nombre: "Nature's Bounty Hair, Skin & Nails Advanced (230 gomitas)",
    categoria: "cuidado-personal",
    marca: "Nature's Bounty",
    precio: 120000,
    stock: 20,
    color: "#c94f7c",
    descripcion: "Fórmula avanzada con biotina para cabello, piel y uñas. 230 gomitas.",
    destacado: true,
  },
  {
    sku: "VM-SUPERB-500",
    nombre: "Kirkland Super B-Complex con Electrolitos (500 tabletas)",
    categoria: "vitaminas-minerales",
    marca: "Kirkland Signature",
    precio: 130000,
    stock: 20,
    color: "#e0a020",
    descripcion: "Complejo de vitaminas B con electrolitos. Apoya el metabolismo energético. 500 tabletas.",
    destacado: false,
  },
  {
    sku: "VM-VITC-XS-365",
    nombre: "Nature Made Vitamina C Extra Fuerte 1000 mg (365 tabletas)",
    categoria: "vitaminas-minerales",
    marca: "Nature Made",
    precio: 160000,
    stock: 20,
    color: "#e0813b",
    descripcion: "Vitamina C de alta potencia para apoyar el sistema inmune. 365 tabletas.",
    destacado: true,
  },
  {
    sku: "VM-VITC-500",
    nombre: "Kirkland Vitamina C 1000 mg (500 tabletas)",
    categoria: "vitaminas-minerales",
    marca: "Kirkland Signature",
    precio: 130000,
    stock: 20,
    color: "#e59422",
    descripcion: "Vitamina C 1000 mg. Antioxidante y apoyo inmune. 500 tabletas.",
    destacado: false,
  },
  {
    sku: "CP-HSN-250",
    nombre: "Nature's Bounty Hair, Skin & Nails (250 softgels)",
    categoria: "cuidado-personal",
    marca: "Nature's Bounty",
    precio: 120000,
    stock: 20,
    color: "#d1608a",
    descripcion: "Con biotina y antioxidantes para cabello, piel y uñas. 250 cápsulas blandas.",
    destacado: false,
  },
  {
    sku: "SUP-FATBURN-130",
    nombre: "youtheory Daily Fat Burner (130 cápsulas)",
    categoria: "suplementos",
    marca: "youtheory",
    precio: 160000,
    stock: 20,
    color: "#c0392b",
    descripcion: "Quemador de grasa diario con té verde y cafeína. Apoya el metabolismo. 130 cápsulas.",
    destacado: false,
  },
  {
    sku: "SUP-ASHGUM-180",
    nombre: "youtheory Ashwagandha (180 gomitas, frutos rojos)",
    categoria: "suplementos",
    marca: "youtheory",
    precio: 160000,
    stock: 20,
    color: "#7d3c4a",
    descripcion: "Ashwagandha en gomitas sabor frutos rojos. Apoya el manejo del estrés. 180 gomitas.",
    destacado: true,
  },
  {
    sku: "SUP-ASH-180",
    nombre: "youtheory Ashwagandha 1000 mg (180 cápsulas)",
    categoria: "suplementos",
    marca: "youtheory",
    precio: 160000,
    stock: 20,
    color: "#2f6f68",
    descripcion: "Adaptógeno con 1000 mg de ashwagandha KSM-66. Apoya la respuesta al estrés. 180 cápsulas.",
    destacado: true,
  },
  {
    sku: "SUP-COLLVER-345",
    nombre: "youtheory Colágeno Verisol con Biotina (345 comprimidos)",
    categoria: "suplementos",
    marca: "youtheory",
    precio: 200000,
    stock: 20,
    color: "#b5651d",
    descripcion: "Colágeno Verisol con biotina. Apoya piel, cabello y uñas. 345 comprimidos.",
    destacado: false,
  },
  {
    sku: "VM-MAGGUM-90",
    nombre: "Nature Made Magnesio Glicinato 100 mg (90 gomitas)",
    categoria: "vitaminas-minerales",
    marca: "Nature Made",
    precio: 130000,
    stock: 20,
    color: "#3b8f6a",
    descripcion: "Magnesio glicinato en gomitas. Apoya músculos y sistema nervioso. 90 gomitas.",
    destacado: false,
  },
  {
    sku: "VM-PRENATAL-150",
    nombre: "Nature Made Prenatal Ácido Fólico + DHA (150 softgels)",
    categoria: "vitaminas-minerales",
    marca: "Nature Made",
    precio: 200000,
    stock: 20,
    color: "#e08aa8",
    descripcion: "Multivitamínico prenatal con ácido fólico y DHA. Apoyo durante el embarazo. 150 softgels.",
    destacado: true,
  },
  {
    sku: "SUP-FISHOIL-400",
    nombre: "Kirkland Omega-3 Aceite de Pescado 1000 mg (400 softgels)",
    categoria: "suplementos",
    marca: "Kirkland Signature",
    precio: 130000,
    stock: 20,
    color: "#d4a017",
    descripcion: "Aceite de pescado con omega-3. Apoya la salud del corazón. 400 cápsulas blandas.",
    destacado: false,
  },
  {
    sku: "VM-VITE-500",
    nombre: "Kirkland Vitamina E 180 mg (500 softgels)",
    categoria: "vitaminas-minerales",
    marca: "Kirkland Signature",
    precio: 120000,
    stock: 20,
    color: "#c9a227",
    descripcion: "Vitamina E 180 mg (400 UI). Antioxidante para piel e inmunidad. 500 softgels.",
    destacado: false,
  },
  {
    sku: "VM-CALCIO-500",
    nombre: "Kirkland Calcio 600 mg con Vitamina D3 (500 tabletas)",
    categoria: "vitaminas-minerales",
    marca: "Kirkland Signature",
    precio: 110000,
    stock: 20,
    color: "#5a9bd4",
    descripcion: "Calcio 600 mg con vitamina D3. Apoya huesos y dientes. 500 tabletas.",
    destacado: false,
  },
  {
    sku: "SUP-BERBER-60",
    nombre: "Force Factor Ultra Berberina 1200 mg (60 cápsulas)",
    categoria: "suplementos",
    marca: "Force Factor",
    precio: 120000,
    stock: 20,
    color: "#b8860b",
    descripcion: "Berberina HCl 1200 mg con canela de Ceilán y cromo. Apoya el metabolismo y el control de peso. 60 cápsulas.",
    destacado: false,
  },
  {
    sku: "VM-VITE1000-60",
    nombre: "Vitamina E 1000 UI para salud del corazón (60 cápsulas)",
    categoria: "vitaminas-minerales",
    marca: "Nature's Bounty",
    precio: 120000,
    stock: 20,
    color: "#caa93a",
    descripcion: "Vitamina E 1000 UI en cápsulas blandas. Apoyo a la salud del corazón. 60 unidades.",
    destacado: false,
  },
  {
    sku: "SUP-RESV-140",
    nombre: "trunature Resveratrol Plus (140 cápsulas)",
    categoria: "suplementos",
    marca: "trunature",
    precio: 140000,
    stock: 20,
    color: "#8e44ad",
    descripcion: "Resveratrol con extractos antioxidantes. Apoya la salud celular. 140 cápsulas vegetales.",
    destacado: false,
  },
  {
    sku: "SUP-ACV-120",
    nombre: "Nature's Truth Vinagre de Manzana Orgánico 500 mg (120 gomitas)",
    categoria: "suplementos",
    marca: "Nature's Truth",
    precio: 130000,
    stock: 20,
    color: "#6aa84f",
    descripcion: "Vinagre de manzana orgánico en gomitas. Apoya la digestión. 120 gomitas.",
    destacado: false,
  },
  {
    sku: "VM-B12-300",
    nombre: "Kirkland B-12 5000 mcg Disolución Rápida (300 tabletas)",
    categoria: "vitaminas-minerales",
    marca: "Kirkland Signature",
    precio: 130000,
    stock: 20,
    color: "#d1495b",
    descripcion: "Vitamina B-12 de 5000 mcg de disolución rápida. Apoya la energía. 300 tabletas.",
    destacado: false,
  },
  {
    sku: "SUP-MELA-250",
    nombre: "Natrol Melatonina 5 mg Disolución Rápida (250 tabletas)",
    categoria: "suplementos",
    marca: "Natrol",
    precio: 140000,
    stock: 20,
    color: "#5b3f8c",
    descripcion: "Melatonina de 5 mg de disolución rápida. Ayuda a conciliar el sueño. 250 tabletas.",
    destacado: false,
  },
  {
    sku: "SUP-PROBIO-100",
    nombre: "trunature Probiótico Digestivo Avanzado (100 cápsulas)",
    categoria: "suplementos",
    marca: "trunature",
    precio: 130000,
    stock: 20,
    color: "#3b8f6a",
    descripcion: "Probiótico digestivo avanzado con cultivos vivos. Apoya la salud digestiva. 100 cápsulas.",
    destacado: false,
  },
  {
    sku: "SUP-GINSENG-120",
    nombre: "Carlyle Panax Ginseng + Ginkgo Biloba 5.000 mg (120 cápsulas)",
    categoria: "suplementos",
    marca: "Carlyle",
    precio: 120000, // PRECIO ESTIMADO - confirmar con el negocio
    stock: 20,
    color: "#a8763b",
    descripcion: "Panax ginseng con ginkgo biloba, 5.000 mg. Apoya la energía y la concentración. 120 cápsulas vegetarianas.",
    destacado: false,
  },
  {
    sku: "VM-VITD3-650",
    nombre: "Nature Made Vitamina D3 25 mcg (650 softgels)",
    categoria: "vitaminas-minerales",
    marca: "Nature Made",
    precio: 130000, // PRECIO ESTIMADO - confirmar con el negocio
    stock: 20,
    color: "#e0a020",
    descripcion: "Vitamina D3 de 25 mcg (1000 UI). Apoya los huesos, los dientes y el sistema inmune. 650 cápsulas blandas.",
    destacado: false,
  },
];

// Aplica las fotos (imagen + galería) a cada producto por SKU.
for (const p of productos) {
  const fotos = imagenesProductos[p.sku];
  if (fotos) {
    p.imagen = fotos.imagen || "";
    p.imagenes = fotos.imagenes || (fotos.imagen ? [fotos.imagen] : []);
  }
  // Descripción completa (por qué elegirlo, para qué sirve, uso sugerido).
  const desc = descripcionesProductos[p.sku];
  if (desc) {
    if (desc.descripcion) p.descripcion = desc.descripcion;
    if (desc.paraQue) p.paraQue = desc.paraQue;
    if (desc.modoUso) p.modoUso = desc.modoUso;
  }
  // Inventario (cantidad en existencia) leído de las carpetas del negocio.
  if (Object.prototype.hasOwnProperty.call(inventario, p.sku)) {
    p.stock = Math.max(0, Number(inventario[p.sku]) || 0);
  }
}

// Tarifas de envío por región (COP). Envío gratis sobre cierto monto.
export const envios = {
  umbralEnvioGratis: 250000,
  tarifas: [
    { region: "Granada, Meta (domicilio GRATIS)", valor: 0, dias: "Mismo día / 1 día" },
    { region: "Bogotá y área metropolitana", valor: 8000, dias: "1-2 días hábiles" },
    { region: "Ciudades principales", valor: 12000, dias: "2-3 días hábiles" },
    { region: "Resto del país", valor: 16000, dias: "3-6 días hábiles" },
    { region: "Zonas especiales / rurales", valor: 22000, dias: "5-8 días hábiles" },
  ],
};

export const tienda = {
  nombre: "El Garaje de Rochi",
  iniciales: "GR", // Iniciales del logo circular (reemplázalas por la imagen real del logo)
  eslogan: "Vitaminas y suplementos originales, con envío a todo el país",
  whatsapp: "573144503681", // WhatsApp principal (ventas)
  instagram: "@elgarajederochi_1",
  moneda: "COP",
  contacto: {
    ventas: [
      { nombre: "Ventas", numero: "573144503681", display: "+57 314 450 3681" },
      { nombre: "Ventas", numero: "573219610582", display: "+57 321 961 0582" },
    ],
    soporte: { nombre: "Soporte de la página", numero: "573145190186", display: "+57 314 519 0186" },
    direccion: "Calle 34 # 7-27, Granada, Meta",
    correo: "jbowser121@gmail.com",
    telefono: "+57 314 450 3681",
  },
};
