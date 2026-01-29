@echo off
echo ============================================================
echo  TrustBridge Blockchain - Ganache Setup
echo ============================================================
echo.

echo Step 1: Installing Python dependencies...
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo Step 2: Creating .env file...
if not exist .env (
    copy .env.example .env
    echo .env file created. Please configure it before proceeding.
) else (
    echo .env file already exists.
)
echo.

echo ============================================================
echo  Setup Complete!
echo ============================================================
echo.
echo Next steps:
echo 1. Start Ganache on port 7545
echo 2. Run: python deploy_contract.py
echo 3. Copy the CONTRACT_ADDRESS to your .env file
echo 4. Start the Flask app: python app.py
echo.
pause
