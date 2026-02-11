@echo off
chcp 65001 > nul
echo ===================================================
echo      نظام النشر المتكامل (GitHub + Hostinger)
echo ===================================================
echo.

:: 1. Git Push to GitHub
echo [1/2] جاري رفع التعديلات إلى GitHub...
set /p commit_msg="أدخل وصف التعديلات: "

cd ..
git add .
git commit -m "%commit_msg%"
git push origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [خطأ] فشل الرفع إلى GitHub. تأكد من وجود انترنت أو صلاحيات الوصول.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ===================================================
echo [2/2] جاري تحديث سيرفر الإنتاج (Hostinger)...
echo ===================================================
echo.

:: 2. SSH Update
ssh -p 65002 u494530316@82.198.227.148 "if [ -d 'domains/cpoint-sa.com/public_html' ]; then cd domains/cpoint-sa.com/public_html; else cd public_html; fi && echo 'Current Directory:' && pwd && echo 'Updating Code...' && git pull && echo 'Installing Dependencies...' && export PATH=\$PATH:/opt/alt/alt-nodejs22/root/usr/bin:/opt/alt/alt-nodejs20/root/usr/bin:/opt/alt/alt-nodejs18/root/usr/bin:/opt/alt/alt-nodejs16/root/usr/bin && npm install --production && echo 'Restarting App...' && mkdir -p tmp && touch tmp/restart.txt && echo 'DEPLOYMENT SUCCESSFUL!'"

echo.
echo ===================================================
echo تم الانتهاء من عملية النشر بالكامل بنجاح!
echo ===================================================
pause