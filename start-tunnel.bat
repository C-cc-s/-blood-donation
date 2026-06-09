@echo off
chcp 65001 >nul
title 献血报名-隧道(保持此窗口打开)

echo ========================================
echo   献血报名系统 - Cloudflare 隧道
echo   保持此窗口打开，隧道会一直运行
echo ========================================
echo.
cd /d "C:\Users\37706\Desktop\献血"

:loop
echo [%date% %time%] 启动隧道...
cloudflared.exe tunnel --url http://localhost:3000 --no-autoupdate 2> tunnel.log
echo [%date% %time%] 隧道断开，3秒后自动重连...
timeout /t 3 >nul
goto loop
