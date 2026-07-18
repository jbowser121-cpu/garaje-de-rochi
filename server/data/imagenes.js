// Fotos de los productos (fondo blanco). Se guardan aquí para que sean permanentes
// y sobrevivan a un reinicio o despliegue. `imagen` = foto principal; `imagenes` = galería.
const G = (id) => `https://m.media-amazon.com/images/I/${id}._AC_SL1000_.jpg`;
const gal = (...ids) => ids.map(G);
// Fotos tomadas de la tienda de referencia (lascositasdemariae.com, CDN de Shopify).
const S = (f) => `https://cdn.shopify.com/s/files/1/0928/9383/9652/files/${f}`;
const galS = (...fs) => fs.map(S);

export const imagenesProductos = {
  "VM-MAGCIT-180": { imagen: G("71mVYPhN5GL"), imagenes: gal("71mVYPhN5GL", "419pwyAkOlL", "51wfjjcEwNL") },
  "VM-MAGGLY-180": { imagen: G("71tTXHA3SDL") },
  "CP-HSN-ADV-230": { imagen: G("81F9MZ2pL2L"), imagenes: gal("81F9MZ2pL2L", "515pB+O-nwL", "4139SNSs6IL") },
  "VM-SUPERB-500": { imagen: G("61RHTOWBJkL") },
  "VM-VITC-XS-365": { imagen: G("71QGrM7VypL"), imagenes: gal("71QGrM7VypL", "41EvXqAQUAL", "51wlbXpzwjL") },
  "VM-VITC-500": { imagen: G("61VqsXTXbpL") },
  "CP-HSN-250": { imagen: G("71s+TGPqXGL") },
  "SUP-FATBURN-130": { imagen: G("812N3KcS-2L") },
  "SUP-ASHGUM-180": { imagen: G("71tJlo19AzL"), imagenes: gal("71tJlo19AzL", "41fptX3JFtL", "51DmfF7G-JL") },
  "SUP-ASH-180": { imagen: S("DC94EC25-739C-4515-A8E4-F12D99BFE972.jpg"), imagenes: galS("DC94EC25-739C-4515-A8E4-F12D99BFE972.jpg", "4CD9434F-F3B7-465E-B40F-605CFEEF4BBF.jpg", "DBF920F5-FA64-4BCF-B0C4-15B8C1B92758.jpg") },
  "SUP-COLLVER-345": { imagen: S("3F43D20B-68F8-47B9-806A-9F7C8EDE2074.jpg"), imagenes: galS("3F43D20B-68F8-47B9-806A-9F7C8EDE2074.jpg", "EA16ED90-C6C6-4610-B18C-7A50A4F69F5E.webp", "9B58B573-D4B2-4D9F-BC87-41858887BE1B.webp") },
  "VM-MAGGUM-90": { imagen: G("818LIHMfT+L") },
  "VM-PRENATAL-150": { imagen: S("5629F639-31DA-434F-ACF0-B722DA8AA21F.png"), imagenes: galS("5629F639-31DA-434F-ACF0-B722DA8AA21F.png", "DA304ED0-1826-45C2-AD6D-695542D97E2B.png") },
  "SUP-FISHOIL-400": { imagen: G("71IECi3a3mL") },
  "VM-VITE-500": { imagen: G("81FT8r9x66L") },
  "VM-CALCIO-500": { imagen: G("71IllqxHMXL") },
  "SUP-BERBER-60": { imagen: G("81mGw0gjiHL") },
  "VM-VITE1000-60": { imagen: G("71PFx4p07jL") },
  "SUP-RESV-140": { imagen: G("31nD4pT7hhL") },
  "SUP-ACV-120": { imagen: S("IMG-1898.png"), imagenes: galS("IMG-1898.png", "IMG-1899.png", "IMG-1900.png") },
  "VM-B12-300": { imagen: G("61gzhwxtAML") },
};
