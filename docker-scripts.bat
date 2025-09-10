@echo off
setlocal enabledelayedexpansion

REM PteroDash Docker Management Scripts for Windows

REM Colors (Windows doesn't support colors in batch, but we can use echo)
set "RED=[ERROR]"
set "GREEN=[INFO]"
set "YELLOW=[WARNING]"
set "BLUE=[HEADER]"

REM Function to print colored output
:print_status
echo %GREEN% %~1
goto :eof

:print_warning
echo %YELLOW% %~1
goto :eof

:print_error
echo %RED% %~1
goto :eof

:print_header
echo.
echo %BLUE%================================
echo %BLUE%~1
echo %BLUE%================================
goto :eof

REM Check if Docker is installed
:check_docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo %RED% Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo %RED% Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)
goto :eof

REM Setup environment file
:setup_env
if not exist .env (
    echo %GREEN% Creating .env file from template...
    copy docker-compose.env .env >nul
    echo %YELLOW% Please edit .env file with your configuration before running the application.
    echo %YELLOW% Important: Change the default passwords and secrets!
    exit /b 0
)
goto :eof

REM Build and start all services (production)
:start
call :print_header "Starting PteroDash (Production)"
call :check_docker
if errorlevel 1 exit /b 1
call :setup_env
if errorlevel 1 exit /b 1

echo %GREEN% Building and starting all services...
docker-compose up -d --build
if errorlevel 1 (
    echo %RED% Build failed! Check the logs above for details.
    echo %GREEN% To view detailed logs: docker-compose logs
    exit /b 1
)

echo %GREEN% Build completed successfully!
echo %GREEN% Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo %GREEN% Checking service health...
docker-compose ps

REM Check if all services are running
docker-compose ps | findstr "Exit" >nul
if not errorlevel 1 (
    echo %RED% Some services failed to start. Check logs with: docker-compose logs
    docker-compose ps
    exit /b 1
)

call :print_header "PteroDash is now running!"
echo %GREEN% Frontend: http://localhost:3000
echo %GREEN% Backend API: http://localhost:4000
echo %GREEN% MongoDB: localhost:27017
echo.
echo %YELLOW% Default Admin Credentials:
echo Email: admin@example.com
echo Password: admin123
echo.
echo %YELLOW% To view logs: docker-compose logs -f
echo %YELLOW% To stop: docker-compose down
goto :eof

REM Start development environment
:dev
call :print_header "Starting PteroDash (Development)"
call :check_docker
if errorlevel 1 exit /b 1

echo %GREEN% Building and starting development services...
docker-compose -f docker-compose.dev.yml up -d --build
if errorlevel 1 (
    echo %RED% Build failed! Check the logs above for details.
    echo %GREEN% To view detailed logs: docker-compose -f docker-compose.dev.yml logs
    exit /b 1
)

echo %GREEN% Build completed successfully!
echo %GREEN% Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo %GREEN% Checking service health...
docker-compose -f docker-compose.dev.yml ps

REM Check if all services are running
docker-compose -f docker-compose.dev.yml ps | findstr "Exit" >nul
if not errorlevel 1 (
    echo %RED% Some services failed to start. Check logs with: docker-compose -f docker-compose.dev.yml logs
    docker-compose -f docker-compose.dev.yml ps
    exit /b 1
)

call :print_header "PteroDash Development is now running!"
echo %GREEN% Frontend: http://localhost:3000 (with hot reload)
echo %GREEN% Backend API: http://localhost:4000 (with hot reload)
echo %GREEN% MongoDB: localhost:27017
echo.
echo %YELLOW% Development Features:
echo • Hot reload enabled for both frontend and backend
echo • Source code is mounted as volumes
echo • All dependencies installed (including dev dependencies)
echo.
echo %YELLOW% To view logs: docker-compose -f docker-compose.dev.yml logs -f
echo %YELLOW% To stop: docker-compose -f docker-compose.dev.yml down
goto :eof

REM Stop all services
:stop
call :print_header "Stopping PteroDash"
docker-compose down
docker-compose -f docker-compose.dev.yml down
echo %GREEN% All services stopped.
goto :eof

REM Restart all services
:restart
call :print_header "Restarting PteroDash"
docker-compose restart
echo %GREEN% All services restarted.
goto :eof

REM View logs
:logs
docker-compose logs -f
goto :eof

REM Clean up everything
:clean
call :print_header "Cleaning up PteroDash"
echo %YELLOW% This will remove all containers, volumes, and images. Are you sure? (y/N)
set /p response=
if /i "%response%"=="y" (
    docker-compose down -v --rmi all
    docker system prune -f
    echo %GREEN% Cleanup completed.
) else (
    echo %GREEN% Cleanup cancelled.
)
goto :eof

REM Show status
:status
call :print_header "PteroDash Status"
docker-compose ps
echo.
echo %GREEN% Service Health:
curl -s -o nul -w "Frontend: %%{http_code}" http://localhost:3000/ 2>nul || echo Frontend: DOWN
curl -s -o nul -w "Backend: %%{http_code}" http://localhost:4000/health 2>nul || echo Backend: DOWN
echo MongoDB: Check docker-compose ps for status
goto :eof

REM Update services
:update
call :print_header "Updating PteroDash"
docker-compose pull
docker-compose up -d --build
echo %GREEN% Update completed.
goto :eof

REM Show help
:help
call :print_header "PteroDash Docker Management"
echo Usage: %~nx0 [COMMAND]
echo.
echo Commands:
echo   start     Start all services (production)
echo   dev       Start development environment with hot reload
echo   stop      Stop all services
echo   restart   Restart all services
echo   logs      View logs from all services
echo   status    Show service status
echo   clean     Remove all containers and volumes
echo   update    Update and restart services
echo   help      Show this help message
echo.
echo Examples:
echo   %~nx0 start    # Start PteroDash (production)
echo   %~nx0 dev      # Start PteroDash (development with hot reload)
echo   %~nx0 logs     # View logs
echo   %~nx0 stop     # Stop PteroDash
echo.
echo Development vs Production:
echo   • Production: Optimized builds, no source mounting
echo   • Development: Hot reload, source code mounted, dev dependencies
goto :eof

REM Main script logic
if "%1"=="start" goto start
if "%1"=="dev" goto dev
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="logs" goto logs
if "%1"=="status" goto status
if "%1"=="clean" goto clean
if "%1"=="update" goto update
if "%1"=="help" goto help
if "%1"=="--help" goto help
if "%1"=="-h" goto help

echo %RED% Unknown command: %1
call :help
exit /b 1