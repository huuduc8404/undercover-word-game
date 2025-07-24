# WebSocket Server Troubleshooting Guide

This guide addresses common issues you might encounter when implementing and deploying the WebSocket server for the Undercover Word Game.

## Server-Side Issues

### Server Won't Start

**Symptoms:**
- Error messages when starting the server
- Process exits immediately

**Possible Causes and Solutions:**

1. **Port already in use**
   ```
   Error: listen EADDRINUSE: address already in use :::3001
   ```
   - Solution: Change the port in your `.env` file or kill the process using the port
   - Check which process is using the port: `lsof -i :3001` (Unix/Mac) or `netstat -ano | findstr :3001` (Windows)

2. **Missing dependencies**
   ```
   Error: Cannot find module 'socket.io'
   ```
   - Solution: Run `npm install` to install all dependencies
   - Check if the package is in your package.json and install it specifically if needed

3. **TypeScript compilation errors**
   ```
   TSError: ⨯ Unable to compile TypeScript
   ```
   - Solution: Fix the TypeScript errors in your code
   - Run `npx tsc --noEmit` to check for errors without compiling

4. **Environment variables not loaded**
   ```
   Error: Missing required environment variable
   ```
   - Solution: Make sure your `.env` file exists and is in the correct location
   - Check that you're calling `dotenv.config()` early in your application

### Connection Issues

**Symptoms:**
- Clients can't connect to the server
- Frequent disconnections

**Possible Causes and Solutions:**

1. **CORS issues**
   ```
   Access to XMLHttpRequest has been blocked by CORS policy
   ```
   - Solution: Check your CORS configuration in the server
   - Make sure the client origin is correctly specified in the CORS options

2. **Incorrect WebSocket URL**
   - Solution: Verify the WebSocket URL in your client code
   - Check that environment variables are correctly set and loaded

3. **Firewall blocking WebSocket connections**
   - Solution: Configure your firewall to allow WebSocket connections on your server port
   - For local development, check if any security software is blocking connections

4. **Socket.IO version mismatch**
   - Solution: Make sure client and server are using compatible Socket.IO versions
   - Check the Socket.IO compatibility table in the documentation

## Client-Side Issues

### Connection Failures

**Symptoms:**
- "Not connected to server" errors
- Socket.IO connection timeout

**Possible Causes and Solutions:**

1. **Server not running**
   - Solution: Make sure the server is running and accessible
   - Check server logs for any errors

2. **Incorrect WebSocket URL**
   - Solution: Verify the WebSocket URL in your environment variables
   - For development: `VITE_WEBSOCKET_URL=http://localhost:3001`
   - For production with tunneling: `VITE_WEBSOCKET_URL=https://your-tunnel-url`

3. **Network issues**
   - Solution: Check if the client can reach the server (try opening the server URL in a browser)
   - Test with a simple ping to the server

4. **SSL/HTTPS issues**
   - Solution: If using HTTPS for the client, the WebSocket server should also use WSS (secure WebSocket)
   - Check for mixed content warnings in the browser console

### Game State Synchronization Issues

**Symptoms:**
- Game state not updating for all players
- Players seeing different game states

**Possible Causes and Solutions:**

1. **Event handling errors**
   - Solution: Check the event handlers in both client and server code
   - Add more logging to track event flow

2. **Race conditions**
   - Solution: Implement proper state synchronization with version numbers or timestamps
   - Make sure the server is the source of truth for game state

3. **Missing event emissions**
   - Solution: Verify that all necessary events are being emitted from both client and server
   - Add logging for all event emissions and receptions

## Tunneling Issues

### ngrok Issues

**Symptoms:**
- ngrok tunnel not working
- Connection errors when using ngrok URL

**Possible Causes and Solutions:**

1. **ngrok not running**
   - Solution: Make sure ngrok is running with the correct port: `ngrok http 3001`

2. **ngrok session expired**
   - Solution: Restart ngrok to get a new URL
   - Consider upgrading to a paid plan for persistent URLs

3. **CORS issues with ngrok URL**
   - Solution: Update your server's CORS configuration to allow the ngrok URL
   - Add the ngrok URL to the allowed origins in your server code

### Cloudflare Tunnel Issues

**Symptoms:**
- Cloudflare Tunnel not connecting
- Error messages in cloudflared logs

**Possible Causes and Solutions:**

1. **Authentication issues**
   - Solution: Re-run `cloudflared tunnel login` to authenticate

2. **Configuration errors**
   - Solution: Check your `config.yml` file for errors
   - Verify that the tunnel ID and credentials file path are correct

3. **Connectivity issues**
   - Solution: Check if cloudflared can reach the Cloudflare network
   - Verify that your local server is running and accessible

## Deployment Issues

### Server Deployment

**Symptoms:**
- Server crashes after deployment
- Memory or CPU usage issues

**Possible Causes and Solutions:**

1. **Memory leaks**
   - Solution: Monitor memory usage and look for patterns
   - Check for unmanaged event listeners or connections

2. **High CPU usage**
   - Solution: Profile your application to identify bottlenecks
   - Consider optimizing game state updates and event handling

3. **Uncaught exceptions**
   - Solution: Add proper error handling throughout your code
   - Implement a global error handler for uncaught exceptions

### Environment Configuration

**Symptoms:**
- Server works locally but not in production
- Environment-specific errors

**Possible Causes and Solutions:**

1. **Missing environment variables**
   - Solution: Make sure all required environment variables are set in your production environment
   - Use a `.env.example` file to document required variables

2. **Path issues**
   - Solution: Use absolute paths or path.join/path.resolve for file operations
   - Be aware of differences in path handling between operating systems

3. **Different Node.js versions**
   - Solution: Specify the Node.js version in your package.json or use a tool like nvm
   - Test with the same Node.js version that will be used in production

## Performance Issues

### High Latency

**Symptoms:**
- Slow response times
- Delayed game state updates

**Possible Causes and Solutions:**

1. **Server overload**
   - Solution: Monitor server resources and scale if necessary
   - Optimize game state updates to reduce server load

2. **Network latency**
   - Solution: Choose a server location closer to your players
   - Consider using a CDN for static assets

3. **Large payloads**
   - Solution: Minimize the size of data being sent over WebSockets
   - Implement delta updates instead of sending the entire game state

### Connection Limits

**Symptoms:**
- New players can't connect after a certain number
- Existing connections drop when new ones are made

**Possible Causes and Solutions:**

1. **Socket.IO connection limits**
   - Solution: Configure Socket.IO to handle more connections
   - Adjust the server's maxHttpBufferSize and pingTimeout settings

2. **System resource limits**
   - Solution: Increase system limits for open files and connections
   - On Linux: `ulimit -n 10000` to increase file descriptor limit

3. **Proxy or firewall limits**
   - Solution: Configure your proxy or firewall to allow more concurrent connections
   - Check timeout settings in any intermediary services

## Debugging Tips

1. **Enable verbose logging**
   ```javascript
   // Server-side
   const io = new Server(server, {
     cors: { ... },
     debug: true
   });

   // Client-side
   const socket = io(WEBSOCKET_URL, {
     debug: true
   });
   ```

2. **Monitor WebSocket traffic**
   - Use browser DevTools Network tab with the WS filter
   - Look for failed connections or unexpected disconnections

3. **Test with multiple clients**
   - Open multiple browser windows or use different devices
   - Verify that game state is synchronized correctly across all clients

4. **Implement heartbeat mechanism**
   ```javascript
   // Server-side
   io.on('connection', (socket) => {
     const interval = setInterval(() => {
       socket.emit('ping', Date.now());
     }, 10000);

     socket.on('pong', (latency) => {
       console.log(`Latency for ${socket.id}: ${Date.now() - latency}ms`);
     });

     socket.on('disconnect', () => {
       clearInterval(interval);
     });
   });

   // Client-side
   socket.on('ping', (timestamp) => {
     socket.emit('pong', timestamp);
   });
   ```

5. **Use Socket.IO Admin UI for monitoring**
   - Install `@socket.io/admin-ui` package
   - Configure the server to use the admin UI
   - Monitor connections, rooms, and events in real-time

## Common Error Messages and Solutions

| Error Message | Possible Cause | Solution |
|---------------|----------------|----------|
| `EADDRINUSE` | Port already in use | Change the port or kill the process using it |
| `ECONNREFUSED` | Server not running or wrong address | Check server status and connection URL |
| `WebSocket connection failed` | Network issues or CORS | Check network, firewall, and CORS settings |
| `Transport close` | Connection interrupted | Implement reconnection logic |
| `Invalid namespace` | Incorrect Socket.IO namespace | Check namespace in connection URL |
| `Unauthorized` | Authentication failed | Verify authentication credentials |

Remember that most WebSocket issues are related to connectivity, configuration, or event handling. Systematic debugging with proper logging will help identify and resolve most problems.