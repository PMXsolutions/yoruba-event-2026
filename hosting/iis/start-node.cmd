@echo off
setlocal
cd /d "%~dp0"
if not exist "logs" mkdir "logs"

set "NODE_EXE="
if exist "C:\Program Files\nodejs\node.exe" set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not defined NODE_EXE if exist "C:\Program Files (x86)\nodejs\node.exe" set "NODE_EXE=C:\Program Files (x86)\nodejs\node.exe"

if not defined NODE_EXE (
  echo node.exe was not found. Install the Node.js LTS Windows installer for all users.
  echo Checked "C:\Program Files\nodejs\node.exe" and "C:\Program Files (x86)\nodejs\node.exe".
  exit /b 9009
)

"%NODE_EXE%" "%~dp0preload.cjs"
