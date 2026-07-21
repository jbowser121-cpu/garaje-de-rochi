@echo off
title Actualizar inventario - El Garaje de Rochi
echo ================================================
echo   ACTUALIZANDO INVENTARIO - El Garaje de Rochi
echo ================================================
echo.
echo Leyendo las cantidades de tus carpetas y subiendo a la pagina...
echo.
cd /d "C:\Users\omarc\Downloads\clode"
node actualizar-inventario.mjs
echo.
echo ------------------------------------------------
echo   Listo. Tu pagina se actualiza en ~1 minuto.
echo   Ya puedes cerrar esta ventana.
echo ------------------------------------------------
echo.
pause
