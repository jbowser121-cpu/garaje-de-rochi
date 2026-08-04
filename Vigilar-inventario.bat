@echo off
chcp 65001 >nul
title Garaje de Rochi - actualizacion automatica del inventario
cd /d "%~dp0"
node scripts/vigilar-inventario.mjs
echo.
echo  La vigilancia se detuvo.
pause
