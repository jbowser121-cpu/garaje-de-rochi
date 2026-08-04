@echo off
chcp 65001 >nul
title Actualizar la pagina del Garaje de Rochi
cd /d "%~dp0"
echo.
echo  ================================================
echo    GARAJE DE ROCHI - Actualizar la pagina desde el Excel
echo  ================================================
echo.
node scripts/actualizar-desde-excel.mjs
echo.
echo  ------------------------------------------------
echo   Puedes cerrar esta ventana.
echo.
pause
