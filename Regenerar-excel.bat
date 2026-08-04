@echo off
chcp 65001 >nul
title Regenerar el Excel de inventario
cd /d "%~dp0"
echo.
echo  ================================================
echo    GARAJE DE ROCHI - Regenerar inventario.xlsx
echo  ================================================
echo.
echo   OJO: vuelve a crear el Excel desde el catalogo
echo   de la pagina. Usalo solo cuando se agreguen
echo   productos nuevos. Se guarda copia del anterior.
echo.
set /p RESP="Escribe SI y pulsa Enter para continuar: "
if /i not "%RESP%"=="SI" goto :fin
echo.
node scripts/generar-excel.mjs
:fin
echo.
pause
