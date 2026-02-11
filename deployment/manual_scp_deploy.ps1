# Deployment script for Creative Poinet (PowerShell) - Radical Version
$remote_user = "u494530316"
$remote_host = "82.198.227.148"
$remote_port = "65002"
$remote_path = "/home/u494530316/domains/cpoint-sa.com/public_html"

Write-Host "--- STARTING RADICAL DEPLOYMENT ---" -ForegroundColor Cyan

# 1. Clean up remote directories first to ensure no stale files (except node_modules and data)
Write-Host "Cleaning remote directories..." -ForegroundColor Yellow
$clean_cmd = "cd $remote_path ; rm -rf config controllers middleware models public routes views scripts app.js"
ssh -p $remote_port "${remote_user}@${remote_host}" $clean_cmd

# 2. Upload Folders
$folders = @("config", "controllers", "middleware", "models", "public", "routes", "views", "scripts")
foreach ($folder in $folders) {
    Write-Host "Uploading folder: $folder..." -ForegroundColor Yellow
    scp -P $remote_port -r "$folder" "${remote_user}@${remote_host}:${remote_path}/"
}

# 3. Upload Individual files
$files = @("app.js", "package.json")
foreach ($file in $files) {
    Write-Host "Uploading file: $file..." -ForegroundColor Yellow
    scp -P $remote_port $file "${remote_user}@${remote_host}:${remote_path}/$file"
}

# 4. Force Restart and Clear Cache
Write-Host "Force Restarting Application..." -ForegroundColor Green
# Touch restart.txt is standard for Passenger/Node setups on many shared hosts
ssh -p $remote_port "${remote_user}@${remote_host}" "mkdir -p ${remote_path}/tmp ; touch ${remote_path}/tmp/restart.txt"

# 5. Verify a key file to be sure
Write-Host "Verifying deployment..." -ForegroundColor Cyan
ssh -p $remote_port "${remote_user}@${remote_host}" "grep 'hero-video-wrapper' ${remote_path}/views/home_ar.ejs"

Write-Host "--- DEPLOYMENT COMPLETED SUCCESSFULLY ---" -ForegroundColor Green
