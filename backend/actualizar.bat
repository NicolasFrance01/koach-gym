@echo off
chcp 65001 >nul
echo.
echo  Actualizando Fusion Fitness...
echo.

set DEST=C:\Program Files\GymAtlas

taskkill /F /IM FusionFitness.exe >nul 2>&1
echo  [OK] App cerrada (si estaba abierta)

xcopy /E /Y /I "dist\FusionFitness\*" "%DEST%\" >nul
echo  [OK] Archivos actualizados en %DEST%

echo.
echo  Listo! Abre la app desde el acceso directo del escritorio.
echo.
pause
