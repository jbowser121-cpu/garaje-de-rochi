// Fotos de los productos (fondo blanco). Se guardan aquí para que sean permanentes
// y sobrevivan a un reinicio o despliegue. `imagen` = foto principal; `imagenes` = galería.
const G = (id) => `https://m.media-amazon.com/images/I/${id}._AC_SL1000_.jpg`;
const gal = (...ids) => ids.map(G);

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
  "SUP-ASH-180": { imagen: G("81iImW0VMjL"), imagenes: gal("81iImW0VMjL", "419lowzRYwL", "41312YrmYcL") },
  "SUP-COLLVER-345": { imagen: G("71uABMzgYxL"), imagenes: gal("71uABMzgYxL", "41HhV7Gp3eL", "41RKT6KyfvL") },
  "VM-MAGGUM-90": { imagen: G("818LIHMfT+L") },
  "VM-PRENATAL-150": { imagen: G("71XV3+ZIB2L"), imagenes: gal("71XV3+ZIB2L", "41RejoSCFrL", "51HCzeOyqwL") },
  "SUP-FISHOIL-400": { imagen: G("71IECi3a3mL") },
  "VM-VITE-500": { imagen: G("81FT8r9x66L") },
  "VM-CALCIO-500": { imagen: G("71IllqxHMXL") },
  "SUP-BERBER-60": { imagen: G("81mGw0gjiHL") },
  "VM-VITE1000-60": { imagen: G("71PFx4p07jL") },
  "SUP-RESV-140": { imagen: G("31nD4pT7hhL") },
  "SUP-ACV-120": { imagen: G("71YbZeesYvL") },
  "VM-B12-300": { imagen: G("61gzhwxtAML") },
};
