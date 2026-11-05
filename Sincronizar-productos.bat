@echo off
chcp 65001 >nul
title Sincronizar productos (pagina -> inventario + ventas)
cd /d "%~dp0"
echo.
echo  ===========================================================
echo    GARAJE DE ROCHI - Sincronizar productos
echo  ===========================================================
echo.
echo   Pone los MISMOS productos de la pagina en:
echo     1) inventario.xlsx  (inventario)
echo     2) Excel de ventas  (hoja Productos / desplegable)
echo.
echo   OJO: cierra el Excel de ventas antes de continuar.
echo.
set /p RESP="Escribe SI y pulsa Enter para continuar: "
if /i not "%RESP%"=="SI" goto :fin

set "PY=C:\Users\omarc\AppData\Local\Python\pythoncore-3.14-64\python.exe"
set "CAT=%TEMP%\gr_catalogo.json"

echo.
echo  [1/2] Regenerando inventario.xlsx ...
node scripts/generar-excel.mjs
if errorlevel 1 goto :error

echo.
echo  [2/2] Sincronizando el Excel de ventas ...
node scripts/dump-catalogo.mjs > "%CAT%"
if errorlevel 1 goto :error
set PYTHONUTF8=1
"%PY%" -I scripts/sincronizar_ventas_garaje.py "%CAT%"
if errorlevel 1 goto :error
del "%CAT%" >nul 2>&1

echo.
echo  LISTO: los productos quedaron iguales en la pagina, el inventario y el Excel de ventas.
goto :fin

:error
echo.
echo  *** Hubo un error. Revisa que el Excel de ventas este CERRADO y vuelve a intentar. ***

:fin
echo.
pause
