@echo off
echo Deploying Child Health Backend to Google Cloud...
echo.

REM Check if gcloud is available
gcloud version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: gcloud is not found in PATH
    echo Please run this script from Google Cloud SDK Shell
    echo or add gcloud to your PATH
    pause
    exit /b 1
)

echo Checking authentication...
gcloud auth list

echo.
echo Current project:
gcloud config get-value project

echo.
echo Deploying backend to Google Cloud Run...
gcloud run deploy child-health-backend ^
    --source=backend ^
    --platform=managed ^
    --region=us-central1 ^
    --allow-unauthenticated ^
    --memory=512Mi ^
    --cpu=1 ^
    --max-instances=10 ^
    --port=8080

echo.
echo Getting service URL...
gcloud run services describe child-health-backend --region=us-central1 --format="value(status.url)"

echo.
echo Deployment complete!
pause
