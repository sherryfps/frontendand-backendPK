@echo off
title PK Corporate ERP - Local Dev
color 0E
setlocal enabledelayedexpansion

echo ============================================
echo   PK CORPORATE ERP - LOCAL DEVELOPMENT
echo ============================================
echo.

:: Load environment variables from backend\.env if it exists
if exist "%~dp0backend\.env" (
    echo        Loading environment variables from backend\.env...
    for /f "usebackq eol=# tokens=1,* delims==" %%i in ("%~dp0backend\.env") do (
        set "val=%%j"
        if defined val (
            set "val=!val:"=!"
            set "%%i=!val!"
        )
    )
)
echo.

:: -------------------------------------------------
:: 1. START POSTGRESQL
:: -------------------------------------------------
echo [1/3] Checking PostgreSQL...
docker compose up -d postgres 2>nul
if %ERRORLEVEL% EQU 0 (
    echo        PostgreSQL started via Docker on port 5432
) else (
    echo        Docker not found - assuming PostgreSQL is already running locally
    echo        Verify: pg_isready -U postgres
)
echo.

:: -------------------------------------------------
:: 2. START BACKEND (Spring Boot via Maven)
:: -------------------------------------------------
echo [2/3] Starting Spring Boot backend on port 9090...
start "PK-ERP Backend" /d "%~dp0backend" cmd /k mvnw.cmd spring-boot:run
echo        Backend starting in new window...
echo        Wait for "Started PkCorporateErpApplication" before opening frontend
echo.

:: -------------------------------------------------
:: 3. START FRONTEND (Vite on port 3000)
:: -------------------------------------------------
echo [3/3] Checking if npm is installed...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] npm was not found in your system PATH.
    echo Please install Node.js from https://nodejs.org to run the frontend.
    echo Skipping React frontend startup.
    goto :skip_frontend
)

echo        Starting React frontend on port 3000...
start "PK-ERP Frontend" /d "%~dp0frontend" cmd /k "set VITE_PROXY_TARGET=http://localhost:9090&&set VITE_API_URL=http://localhost:9090/api&&npm run dev"
echo        Frontend starting in new window...

:skip_frontend
echo.

echo ============================================
echo   All services starting!
echo.
echo   PostgreSQL : localhost:5432
echo   Backend    : http://localhost:9090/api
echo   Frontend   : http://localhost:3000
echo   Swagger    : http://localhost:9090/api/swagger-ui.html
echo ============================================
echo.
echo Close this window to stop only the database.
echo Use Ctrl+C in each window to stop backend/frontend.
echo.
pause