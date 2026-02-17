@echo off
REM Secure Deployment Script for Cunny Voice (Windows)
REM This script ensures a clean rebuild with all security measures

echo ==========================================
echo Cunny Voice Secure Deployment
echo ==========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please create a .env file based on env.example with secure values.
    exit /b 1
)

echo Step 1: Stopping and removing all containers...
docker-compose down --rmi all --volumes --remove-orphans

echo.
echo Step 2: Pruning Docker build cache...
docker builder prune -af

echo.
echo Step 3: Building services with no cache...
docker-compose build --no-cache --progress=plain

echo.
echo Step 4: Starting services...
docker-compose up -d

echo.
echo Step 5: Waiting for services to be healthy...
timeout /t 10 /nobreak

echo.
echo Step 6: Checking service status...
docker-compose ps

echo.
echo ==========================================
echo Deployment Complete
echo ==========================================
echo.
echo Next steps:
echo 1. Verify all containers are running: docker-compose logs
echo 2. Test the voice channel connection
echo 3. Check browser Network tab for Authorization header
echo.
echo Security reminders:
echo - Keep .env file secure and backed up
echo - Do not commit .env to version control (.gitignore it)
echo - Rotate secrets periodically
echo - Monitor token server logs for unauthorized access
echo.
pause
