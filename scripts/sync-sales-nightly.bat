@echo off
REM Script para ejecutar sync nocturno de sales
REM Guardar como: sync-sales-nightly.bat

echo 🌙 Iniciando sync nocturno de sales...
echo Fecha: %date% %time%

REM Cambiar al directorio del proyecto
cd /d "C:\Users\alida\EncantoIQ"

REM Ejecutar el script de sync
node scripts/sync-sales-full.js

echo.
echo ✅ Sync nocturno completado
echo Fecha fin: %date% %time%

REM Crear log con timestamp
echo %date% %time% - Sync nocturno ejecutado >> sync-nightly.log

pause
