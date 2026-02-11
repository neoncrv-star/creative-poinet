#!/bin/bash
# Deployment script for Creative Poinet (Bash)

REMOTE_USER="u494530316"
REMOTE_HOST="82.198.227.148"
REMOTE_PORT="65002"
REMOTE_PATH="domains/cpoint-sa.com/public_html"

echo "Starting deployment..."

# Folders to upload
FOLDERS=("config" "controllers" "middleware" "models" "public" "routes" "views")
# Individual files
FILES=("app.js" "package.json")

for folder in "${FOLDERS[@]}"; do
    echo "Uploading folder: $folder..."
    scp -P $REMOTE_PORT -r "$folder" $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/
done

for file in "${FILES[@]}"; do
    echo "Uploading file: $file..."
    scp -P $REMOTE_PORT "$file" $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/
done

echo "Restarting application..."
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "touch $REMOTE_PATH/tmp/restart.txt"

echo "Deployment completed successfully!"
