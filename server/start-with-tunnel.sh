#!/bin/bash

# Start the server in the background
echo "Starting the server..."
npm run dev &
SERVER_PID=$!

# Wait for the server to start
echo "Waiting for the server to start..."
sleep 5

# Start ngrok
echo "Starting ngrok tunnel..."
ngrok http 3001

# When ngrok is closed, kill the server
echo "Stopping the server..."
kill $SERVER_PID