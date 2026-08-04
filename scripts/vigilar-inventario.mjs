// Vigila inventario.xlsx. Cada vez que lo guardes y lo cierres, publica la página solo.
// Se arranca con doble clic en "Vigilar-inventario.bat" y se deja abierto en segundo plano.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ARCHIVO = 'inventario.xlsx';
const BLOQUEO = '~$inventario.xlsx';       // Excel crea este archivo mientras lo tienes abierto
const ESPERA_MS = 12000;                   // silencio que hay que esperar antes de publicar

const hora = () => new Date().toLocaleTimeString('es-CO');
const log = (msg) => console.log(`[${hora()}] ${msg}`);

let temporizador = null;
let publicando = false;
let huellaPublicada = '';

function huella() {
  try {
    const s = fs.statSync(path.join(raiz, ARCHIVO));
    return `${s.size}-${s.mtimeMs}`;
  } catch { return ''; }
}

function publicar() {
  if (publicando) return;

  // Si el Excel sigue abierto, no tocamos nada todavía: esperamos a que lo cierres.
  if (fs.existsSync(path.join(raiz, BLOQUEO))) {
    log('El Excel sigue abierto. Espero a que lo cierres…');
    programar();
    return;
  }

  const actual = huella();
  if (!actual) { log('No encuentro inventario.xlsx.'); return; }
  if (actual === huellaPublicada) { log('Sin cambios nuevos.'); return; }

  publicando = true;
  log('Cambios detectados. Publicando…\n');

  const hijo = spawn(process.execPath, [path.join(raiz, 'scripts', 'actualizar-desde-excel.mjs')], {
    cwd: raiz, stdio: 'inherit',
  });

  hijo.on('close', (codigo) => {
    publicando = false;
    if (codigo === 0) { huellaPublicada = huella(); log('\n✅ Listo. Sigo vigilando…\n'); }
    else log('\n⚠ Hubo un problema. Revisa el mensaje de arriba. Sigo vigilando…\n');
  });
}

function programar() {
  clearTimeout(temporizador);
  temporizador = setTimeout(publicar, ESPERA_MS);
}

console.log('\n════════════════════════════════════════════════');
console.log('   EL GARAJE DE ROCHI — vigilando el inventario');
console.log('════════════════════════════════════════════════\n');
log(`Vigilando: ${path.join(raiz, ARCHIVO)}`);
log(`Cada vez que guardes y cierres el Excel, la página se actualiza sola.`);
log('Deja esta ventana abierta. Para detenerlo, ciérrala.\n');

huellaPublicada = huella();

fs.watch(raiz, (tipo, nombre) => {
  if (!nombre) return;
  if (nombre !== ARCHIVO && nombre !== BLOQUEO) return;
  programar();
});
