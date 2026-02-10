@echo off
echo ==========================================
echo      SETUP PASSWORDLESS LOGIN
echo ==========================================
echo.
echo We will now copy your security key to the server.
echo You will need to enter the password ONE LAST TIME.
echo.
echo Password to use: 0548878200aA@@
echo.
set "KEY=ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDMWo6wvSDbXLGkzqjfqYp6uhLukOAVK3nIzMm5zMO4yvr1up3/b6cc8N1ehIVDlDk8D7GCPDJAS/dx80yzIc1VWvLmYY07jppYzv0fkxzK1ACxRsUR2gf25/v1OPM/8nBWHFiVSRsjsWeGwONqOxLOHOmqhlf/ydS1nwGa0YJGLhQqvHbz04kEjyEq6rTYUHqBpxXY6Xp5baNEZYnLHdRDMh8FaCVfGFkwPYjXGhWfWTb4mMplGWlyTWTNeSKaZ+88gWdEYLazmVqaki50NIYgIdtByYlnSkVJv+CqBnBZpdHDIYGkTB5Ac9XQWylGoZ8cAJjv/mbr2Nv4GdtaWVLjLfQHVoeY5ufMz2DHrC6v5pxvmIETTJhGzui25omV6MLTP95HMSOu5tOx/2XI0REODz9mBrx3vC2aUmABXzihEqVs10B7TLRXHbdYQ/+cjxjxTBt3kjorLz54oQnvvkjU4/DFg5uJCRllkBBtdZOvFaEcDZWon7kCBEnzi/N1sAMRMRvLNXwlBRLCUKDnsLI0TxdaYxD/fx1oHYF6bUB3owEBSJ5NPQGcGR4CXm/xcYvH8DgRWGYAlosBx4XnFsXWVFTc58KrGC2POdF9/zbOhq3GlsDZNjLCXy1HKfiF5FVxWYRM8SOQwR7AT8WAh/lvCkvVp0orUwbMmRvqmDr04w== mohamed@DESKTOP-IESQ8F8"

ssh -p 65002 u494530316@82.198.227.148 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo %KEY% >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo 'Key Setup Complete!'"
echo.
pause
