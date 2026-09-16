@echo off
title BentaHub Print Server
cd /d "%~dp0.."
node server/print-server.cjs
pause