# Crea los accesos directos de El Garaje de Rochi en el Escritorio.
# Se ejecuta con doble clic en "Crear-accesos-directos.bat".

$proyecto   = Split-Path -Parent $PSScriptRoot
$escritorio = [Environment]::GetFolderPath('Desktop')
$icono      = Join-Path $proyecto "public\garaje.ico"
$shell      = New-Object -ComObject WScript.Shell

function Nuevo-Acceso($nombre, $destino, $descripcion) {
  $ruta = Join-Path $escritorio "$nombre.lnk"
  $a = $shell.CreateShortcut($ruta)
  $a.TargetPath       = $destino
  $a.WorkingDirectory = $proyecto
  $a.Description      = $descripcion
  if (Test-Path $icono) { $a.IconLocation = $icono }
  $a.Save()
  Write-Output "  OK  $nombre"
}

Write-Output ""
Write-Output "Creando accesos directos en el Escritorio..."
Write-Output ""

Nuevo-Acceso "1 - Inventario Garaje" (Join-Path $proyecto "inventario.xlsx") `
  "Abre el Excel donde manejas precios y existencias del Garaje de Rochi"

Nuevo-Acceso "2 - Actualizar pagina Garaje" (Join-Path $proyecto "Actualizar-pagina.bat") `
  "Publica en la pagina web los cambios del Excel"

Nuevo-Acceso "3 - Actualizacion automatica Garaje" (Join-Path $proyecto "Vigilar-inventario.bat") `
  "Deja esta ventana abierta y la pagina se actualiza sola cada vez que guardes el Excel"

Write-Output ""
Write-Output "Listo. Mira tu Escritorio."
Write-Output ""
