#!/bin/bash
set -e
REMOTE_USER="${REMOTE_USER:-}"
REMOTE_HOST="${REMOTE_HOST:-}"
REMOTE_PORT="${SSH_PORT:-22}"
REMOTE_PATH="${TARGET_DIR:-}"
if [ -z "$REMOTE_USER" ] || [ -z "$REMOTE_HOST" ] || [ -z "$REMOTE_PATH" ]; then
  echo "Set REMOTE_USER, REMOTE_HOST, TARGET_DIR"
  exit 1
fi
FOLDERS=("config" "controllers" "middleware" "models" "public" "routes" "views")
FILES=("app.js" "package.json" ".env.prod" ".env")
for folder in "${FOLDERS[@]}"; do
  scp -P "$REMOTE_PORT" -r "$folder" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"
done
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    scp -P "$REMOTE_PORT" "$file" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"
  fi
done
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $REMOTE_PATH/tmp ; touch $REMOTE_PATH/tmp/restart.txt"
echo "Done"
