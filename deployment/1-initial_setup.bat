@echo off
chcp 65001
echo ===================================================
echo جاري تهيئة المستودع ورفعه لأول مرة...
echo ===================================================

:: إضافة رابط المستودع البعيد (Remote)
git remote add origin https://github.com/neoncrv-star/creative-poinet.git

:: تغيير اسم الفرع الرئيسي إلى main
git branch -M main

:: رفع الملفات إلى GitHub
git push -u origin main

echo.
echo ===================================================
echo تم النشر الأولي بنجاح!
echo ===================================================
pause
