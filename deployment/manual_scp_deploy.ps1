Param(
  [string]$REMOTE_USER = $env:REMOTE_USER,
  [string]$REMOTE_HOST = $env:REMOTE_HOST,
  [string]$SSH_PORT = $env:SSH_PORT,
  [string]$TARGET_DIR = $env:TARGET_DIR
)
if (-not $REMOTE_USER -or -not $REMOTE_HOST -or -not $TARGET_DIR) {
  Write-Host "Set REMOTE_USER, REMOTE_HOST, TARGET_DIR" -ForegroundColor Red
  exit 1
}
if (-not $SSH_PORT) { $SSH_PORT = "22" }
$folders = @("config","controllers","middleware","models","public","routes","views","scripts")
foreach ($folder in $folders) {
  scp -P $SSH_PORT -r "$folder" "$REMOTE_USER@$REMOTE_HOST:$TARGET_DIR/"
}
$files = @("app.js","package.json")
foreach ($file in $files) {
  scp -P $SSH_PORT $file "$REMOTE_USER@$REMOTE_HOST:$TARGET_DIR/$file"
}
ssh -p $SSH_PORT "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $TARGET_DIR/tmp ; touch $TARGET_DIR/tmp/restart.txt"
Write-Host "Done" -ForegroundColor Green
