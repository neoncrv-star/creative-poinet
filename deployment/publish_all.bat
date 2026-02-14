@echo off
chcp 65001 > nul
setlocal ENABLEDELAYEDEXPANSION
echo ===================================================
echo      نشر متكامل GitHub + SSH
echo ===================================================
echo.
echo [1/2] رفع التعديلات إلى GitHub...
set /p commit_msg="أدخل وصف التعديلات: "
git add .
git commit -m "%commit_msg%"
git push origin main
if %ERRORLEVEL% NEQ 0 (
  echo فشل الرفع إلى GitHub
  exit /b 1
)
echo.
echo [2/2] تحديث خادم الإنتاج عبر SSH...
if "%REMOTE_USER%"=="" set /p REMOTE_USER="REMOTE_USER: "
if "%REMOTE_HOST%"=="" set /p REMOTE_HOST="REMOTE_HOST: "
if "%SSH_PORT%"=="" set /p SSH_PORT="SSH_PORT (مثال 22): "
if "%TARGET_DIR%"=="" set /p TARGET_DIR="TARGET_DIR (مسار التطبيق): "
if "%SSH_PORT%"=="" set SSH_PORT=22
ssh -p %SSH_PORT% %REMOTE_USER%@%REMOTE_HOST% "cd %TARGET_DIR% && git fetch --all --prune && git reset --hard origin/main && export PATH=\$PATH:/opt/alt/alt-nodejs22/root/usr/bin:/opt/alt/alt-nodejs20/root/usr/bin:/opt/alt/alt-nodejs18/root/usr/bin:/opt/alt/alt-nodejs16/root/usr/bin && npm ci --omit=optional && export NODE_ENV=production && mkdir -p public/uploads sessions tmp && (command -v pm2 >/dev/null 2>&1 && (pm2 describe creative-point >/dev/null 2>&1 && pm2 reload creative-point || pm2 start app.js --name creative-point) && pm2 save || touch tmp/restart.txt)"
if %ERRORLEVEL% NEQ 0 (
  echo فشل نشر الإنتاج
  exit /b 1
)
echo اكتمل النشر بنجاح
endlocal
