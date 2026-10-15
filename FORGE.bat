@echo off
setlocal enabledelayedexpansion
title FORGE AI - Autonomous Software Engineering Factory [CHIEF ARCHITECT CONSOLE]
color 0B

cls
echo ===============================================================================
echo   ______ ____  _____   _____ ______          _____ 
echo  ^|  ____/ __ \^|  __ \ / ____^|  ____^|   /\   ^|_   _^|
echo  ^| ^|__ ^| ^|  ^| ^| ^|__) ^| ^|  __^| ^|__    /  \    ^| ^|  
echo  ^|  __^|^| ^|  ^| ^|  _  /^| ^| ^|_ ^|  __^|  / /\ \   ^| ^|  
echo  ^| ^|   ^| ^|__^| ^| ^| \ \^| ^|__^| ^| ^|____ / ____ \ _^| ^|_ 
echo  ^|_^|    \____/^|_^|  \_\ \_____^|______/_/    \_\_____^|
echo.
echo           3D CYBER METROPOLIS - MULTI-AGENT ENGINEERING FACTORY
echo                      DIRECTOR OVERSEER TERMINAL
echo ===============================================================================
echo.
echo [*] System Initialization in progress...
echo [*] Base Directory: %~dp0
echo.

:: 1. Verify Python & Node
python --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [!] ERROR: Python is not detected in your PATH. Please install Python 3.10+.
    pause
    exit /b 1
)

node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [!] ERROR: Node.js is not detected in your PATH. Please install Node.js v18+.
    pause
    exit /b 1
)

echo [OK] Python and Node.js runtimes verified.
echo.
echo [*] Initializing Autonomous District Towers:
echo     [1] Citadel Spire          -^> Master Orchestrator (ONLINE)
echo     [2] Intelligence Tower     -^> Product Analyst     (ONLINE)
echo     [3] Blueprint Complex      -^> Software Architect  (ONLINE)
echo     [4] Fabrication Foundry    -^> Implementation Agent (ONLINE)
echo     [5] Quality Bastion        -^> Testing Agent        (ONLINE)
echo     [6] Diagnostic Lab         -^> Debugging Agent      (ONLINE)
echo     [7] Security Citadel       -^> Independent Reviewer (ONLINE)
echo     [8] Archive Monolith       -^> Documentation Agent  (ONLINE)
echo.

:: 2. Launch Backend Server in dedicated window
echo [*] Starting Backend Engine at http://127.0.0.1:8000...
start "FORGE AI Backend Core" /min cmd /c "cd /d "%~dp0backend" && set PYTHONPATH=%~dp0backend && python run.py"

:: 3. Launch Frontend Vite Server in dedicated window
echo [*] Starting 3D Command Center at http://localhost:5173...
start "FORGE AI 3D City Frontend" /min cmd /c "cd /d "%~dp0frontend" && npm run dev"

:: 4. Wait for spin up and open browser
echo [*] Establishing Neural Uplink to 3D Metropolis...
timeout /t 3 /nobreak >nul
start http://localhost:5173

cls
echo ===============================================================================
echo   ______ ____  _____   _____ ______          _____ 
echo  ^|  ____/ __ \^|  __ \ / ____^|  ____^|   /\   ^|_   _^|
echo  ^| ^|__ ^| ^|  ^| ^| ^|__) ^| ^|  __^| ^|__    /  \    ^| ^|  
echo  ^|  __^|^| ^|  ^| ^|  _  /^| ^| ^|_ ^|  __^|  / /\ \   ^| ^|  
echo  ^| ^|   ^| ^|__^| ^| ^| \ \^| ^|__^| ^| ^|____ / ____ \ _^| ^|_ 
echo  ^|_^|    \____/^|_^|  \_\ \_____^|______/_/    \_\_____^|
echo ===============================================================================
echo.
echo  WELCOME, CHIEF ARCHITECT. YOU ARE IN COMPLETE COMMAND OF THE FACTORY.
echo.
echo  [3D METROPOLIS LINK]   http://localhost:5173
echo  [BACKEND API DOCS]     http://127.0.0.1:8000/docs
echo  [PERSISTENT DATABASE]  %~dp0backend\data\forge.db
echo  [WORKSPACES ROOT]      %~dp0backend\data\workspaces
echo.
echo -------------------------------------------------------------------------------
echo  DIRECTOR TERMINAL CONTROLS:
echo    [1] Re-open 3D Agent City in Browser
echo    [2] Run Autonomous Factory Test Suite (pytest)
echo    [3] Trigger Emergency Stop (Halt all agent scheduling)
echo    [4] Resume Normal Operations
echo    [5] Open Workspace Sandboxes Folder
echo    [6] Terminate All Factory Servers & Exit
echo -------------------------------------------------------------------------------
echo.

:MENU
set /p CHOICE="[DIRECTOR@FORGE] Enter command [1-6]: "

if "%CHOICE%"=="1" (
    start http://localhost:5173
    echo [*] 3D City opened in default browser.
    echo.
    goto MENU
)

if "%CHOICE%"=="2" (
    echo.
    echo [*] Running 20-test verification suite...
    cd /d "%~dp0backend"
    set PYTHONPATH=%~dp0backend
    python -m pytest tests -v
    echo.
    goto MENU
)

if "%CHOICE%"=="3" (
    echo [*] Broadcasting Emergency Stop Signal to All Districts...
    curl -s -X POST "http://127.0.0.1:8000/api/budget/emergency-stop?active=true" >nul 2>&1
    echo [!] ALERT: ALL AGENT WORKSPACES LOCKED AND EXECUTION HALTED.
    echo.
    goto MENU
)

if "%CHOICE%"=="4" (
    echo [*] Broadcasting Resume Authorization to All Districts...
    curl -s -X POST "http://127.0.0.1:8000/api/budget/emergency-stop?active=false" >nul 2>&1
    echo [OK] FACTORY EXECUTION RESUMED.
    echo.
    goto MENU
)

if "%CHOICE%"=="5" (
    if not exist "%~dp0backend\data\workspaces" mkdir "%~dp0backend\data\workspaces"
    explorer "%~dp0backend\data\workspaces"
    echo [*] Opened workspace sandboxes directory.
    echo.
    goto MENU
)

if "%CHOICE%"=="6" (
    echo.
    echo [*] Safely shutting down FORGE servers...
    taskkill /FI "WINDOWTITLE eq FORGE AI Backend Core*" /T /F >nul 2>&1
    taskkill /FI "WINDOWTITLE eq FORGE AI 3D City Frontend*" /T /F >nul 2>&1
    echo [OK] All agent towers offline. Factory powered down.
    timeout /t 2 /nobreak >nul
    exit /b 0
)

echo [!] Unknown command. Choose 1-6.
echo.
goto MENU
