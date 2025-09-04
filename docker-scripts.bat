@echo off
setlocal enabledelayedexpansion

REM PteroDash Docker Management Scripts for Windows

:main
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="logs" goto logs
if "%1"=="status" goto status
if "%1"=="clean" goto clean
if "%1"=="update" goto update
if "%1"=="help" goto help
if "%1"=="--help" goto help
if "%1"=="-h" goto help
goto help

:start
echo ================================
echo Starting PteroDash
echo ================================
call :check_docker
call :setup_env
echo [INFO] Building and starting all services...
docker-compose up -d --build
echo [INFO] Waiting for services to be ready...
timeout /t 10 /nobreak >nul
echo [INFO] Checking service health...
docker-compose ps
echo ================================
echo PteroDash is now running!
echo ================================
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:4000
echo MongoDB: localhost:27017
echo.
echo Default Admin Credentials:
echo Email: admin@example.com
echo Password: admin123
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
goto end

:stop
echo ================================
echo Stopping PteroDash
echo ================================
docker-compose down
echo [INFO] All services stopped.
goto end

:restart
echo ================================
echo Restarting PteroDash
echo ================================
docker-compose restart
echo [INFO] All services restarted.
goto end

:logs
docker-compose logs -f
goto end

:status
echo ================================
echo PteroDash Status
echo ================================
docker-compose ps
echo.
echo [INFO] Service Health:
curl -s -o nul -w "Frontend: %%{http_code}" http://localhost:3000/ 2>nul || echo Frontend: DOWN
echo.
curl -s -o nul -w "Backend: %%{http_code}" http://localhost:4000/health 2>nul || echo Backend: DOWN
echo.
goto end

:clean
echo ================================
echo Cleaning up PteroDash
echo ================================
echo [WARNING] This will remove all containers, volumes, and images. Are you sure? (y/N)
set /p response=
if /i "%response%"=="y" (
    docker-compose down -v --rmi all
    docker system prune -f
    echo [INFO] Cleanup completed.
) else (
    echo [INFO] Cleanup cancelled.
)
goto end

:update
echo ================================
echo Updating PteroDash
echo ================================
docker-compose pull
docker-compose up -d --build
echo [INFO] Update completed.
goto end

:help
echo ================================
echo PteroDash Docker Management
echo ================================
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   start     Start all services
echo   stop      Stop all services
echo   restart   Restart all services
echo   logs      View logs from all services
echo   status    Show service status
echo   clean     Remove all containers and volumes
echo   update    Update and restart services
echo   help      Show this help message
echo.
echo Examples:
echo   %0 start    # Start PteroDash
echo   %0 logs     # View logs
echo   %0 stop     # Stop PteroDash
goto end

:check_docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker first.
    exit /b 1
)
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)
goto :eof

:setup_env
if not exist .env (
    echo [INFO] Creating .env file from template...
    copy docker-compose.env .env >nul
    echo [WARNING] Please edit .env file with your configuration before running the application.
    echo [WARNING] Important: Change the default passwords and secrets!
    exit /b 0
)
goto :eof

:end
endlocal
