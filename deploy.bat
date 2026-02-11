@echo off
echo ==========================================
echo      AUTO DEPLOYMENT TO HOSTINGER
echo ==========================================
echo.
echo Connecting using SSH Key (No password needed)...
ssh -p 65002 u494530316@82.198.227.148 "if [ -d 'domains/cpoint-sa.com/public_html' ]; then cd domains/cpoint-sa.com/public_html; else cd public_html; fi && echo 'Current Directory:' && pwd && echo 'Updating Code...' && git pull && echo 'Looking for NPM...' && export PATH=\$PATH:/opt/alt/alt-nodejs22/root/usr/bin:/opt/alt/alt-nodejs20/root/usr/bin:/opt/alt/alt-nodejs18/root/usr/bin:/opt/alt/alt-nodejs16/root/usr/bin && echo 'Node Version:' && node -v && echo 'NPM Version:' && npm -v && echo 'Installing Dependencies...' && npm install --production && echo 'Restarting App...' && mkdir -p tmp && touch tmp/restart.txt && echo 'DEPLOYMENT SUCCESSFUL!'"
echo.
pause
