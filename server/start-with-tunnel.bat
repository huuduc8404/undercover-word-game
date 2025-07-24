@echo off
echo Starting the server...
start /b npm run dev

echo Waiting for the server to start...
timeout /t 5

echo Starting ngrok tunnel...
ngrok http 3001

echo Server and tunnel stopped.