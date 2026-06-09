@echo off
chcp 65001 >nul
title 献血报名-隧道

:loop
echo [%date% %time%] 正在连接隧道...
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes -R 80:localhost:3000 nokey@localhost.run 2> tunnel_url.tmp
echo [%date% %time%] 隧道断开，5秒后重连...
findstr /C:"tunneled with" tunnel_url.tmp > current_url.txt
type current_url.txt
timeout /t 5 >nul
goto loop
