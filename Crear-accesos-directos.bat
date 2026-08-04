@echo off
chcp 65001 >nul
title Garaje de Rochi - crear accesos directos
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\crear-accesos-directos.ps1"
pause
