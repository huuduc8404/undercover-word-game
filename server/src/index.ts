import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { setupGameHandlers } from './handlers/gameHandlers';
import { ClientToServerEvents, ServerToClientEvents } from './types/game';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS - Allow all origins in development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}));

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server with proper type definitions
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Set up game handlers
setupGameHandlers(io);

// Basic health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Server info endpoint
app.get('/api/info', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    version: '1.0.0',
    activeRooms: 0, // TODO: Implement room counting
    uptime: process.uptime()
  });
});

// Serve static files from the React app in the public subfolder
const publicPath = path.resolve(__dirname, '../public');
app.use(express.static(publicPath));

// Handle React routing, return all requests to React app
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Server info: http://localhost:${PORT}/info`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server shut down');
    process.exit(0);
  });
});