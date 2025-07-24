# Undercover Word Game - Combined Server Quick Start Guide

This guide will help you get started with the WebSocket server implementation for the Undercover Word Game. This implementation combines the backend and frontend to run on the same server and domain, with frontend resources served from a subfolder.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Development Setup

1. Install dependencies for both the client and server:
   ```bash
   # Install client dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   ```

2. For development, you'll need to run both the client and server separately:

   Start the server:
   ```bash
   cd server
   npm run dev
   ```

   In a separate terminal, start the client:
   ```bash
   npm run dev
   ```

## Production Setup

For production, you can build and serve everything from the server:

1. Build both frontend and backend:
   ```bash
   cd server
   npm run build:all
   ```

   This will build the frontend, copy it to the server's `public` folder, and build the backend.

2. Start the server:
   ```bash
   npm start
   ```

The server will serve the frontend static files and handle WebSocket connections on the same domain.

## Playing Across Different Networks

To allow players to connect from different networks, you need to expose your server to the internet. There are several options:

### Option 1: Deploy to a hosting service

Deploy your combined server to a hosting service like Heroku, Vercel, or DigitalOcean. This is the recommended approach for production.

### Option 2: Use a tunneling service

For testing or temporary use, you can use a tunneling service:

1. Install ngrok: https://ngrok.com/download
2. Build and start your server:
   ```bash
   cd server
   npm run build:all
   npm start
   ```
3. In a separate terminal, start ngrok: `ngrok http 3001`
4. Share the HTTPS URL provided by ngrok (e.g., https://abc123.ngrok.io) with your players

## Troubleshooting

If you encounter any issues, please refer to the `websocket-server-troubleshooting.md` file for common problems and solutions.

## Additional Documentation

- `websocket-server-implementation-plan.md`: Detailed implementation plan
- `websocket-server-summary.md`: High-level overview of the implementation
- `peer-vs-websocket-comparison.md`: Comparison between PeerJS and WebSocket implementations
- `server/README.md`: Server documentation