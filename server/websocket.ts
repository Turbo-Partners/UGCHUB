import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { IncomingMessage } from 'http';
import session from 'express-session';
import type { User, WebSocketEvent } from '@shared/schema';
import * as cookie from 'cookie';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  isAlive?: boolean;
}

interface SessionRequest extends IncomingMessage {
  session?: session.Session & {
    passport?: {
      user?: number;
    };
  };
}

export class NotificationWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<number, Set<AuthenticatedWebSocket>> = new Map();

  constructor(server: Server, sessionMiddleware: any) {
    this.wss = new WebSocketServer({
      noServer: true
    });

    // Manually handle upgrade to avoid conflicts with Vite HMR WebSocket
    server.on('upgrade', (request, socket, head) => {
      const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
      if (pathname === '/ws/notifications') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      }
      // Other paths (like Vite HMR) are handled by their own upgrade listeners
    });

    this.wss.on('connection', (ws: AuthenticatedWebSocket, req: SessionRequest) => {
      // Reject connections without cookies immediately
      if (!req.headers.cookie) {
        console.log('[WebSocket] Connection rejected - no cookies');
        ws.close(1008, 'Unauthorized');
        return;
      }
      
      // Parse cookies from the WebSocket upgrade request
      const cookies = cookie.parse(req.headers.cookie);
      
      // Attach parsed cookies to request for session middleware
      (req as any).cookies = cookies;
      
      // Create mock response object for session middleware
      const mockRes: any = {
        getHeader: () => {},
        setHeader: () => {},
        writeHead: () => {},
        end: () => {}
      };
      
      const next = (err?: any) => {
        if (err) {
          console.error('[WebSocket] Session middleware error:', err);
          ws.close(1011, 'Session error');
          return;
        }
        
        const userId = req.session?.passport?.user;
        
        if (!userId || typeof userId !== 'number') {
          console.log('[WebSocket] Unauthorized connection attempt - no authenticated user in session');
          ws.close(1008, 'Unauthorized');
          return;
        }

        ws.userId = userId;
        ws.isAlive = true;

        // Add client to tracking map
        if (!this.clients.has(userId)) {
          this.clients.set(userId, new Set());
        }
        this.clients.get(userId)!.add(ws);

        console.log(`[WebSocket] User ${userId} connected successfully`);

        // Heartbeat
        ws.on('pong', () => {
          ws.isAlive = true;
        });

        ws.on('message', (data: string) => {
          try {
            const message = JSON.parse(data.toString());
            // Handle incoming messages if needed
            console.log('[WebSocket] Received:', message);
          } catch (error) {
            console.error('[WebSocket] Invalid message:', error);
          }
        });

        ws.on('close', () => {
          console.log(`[WebSocket] User ${userId} disconnected`);
          const userClients = this.clients.get(userId);
          if (userClients) {
            userClients.delete(ws);
            if (userClients.size === 0) {
              this.clients.delete(userId);
            }
          }
        });

        ws.on('error', (error) => {
          console.error('[WebSocket] Error:', error);
        });
      };
      
      // Run session middleware with parsed cookies
      try {
        sessionMiddleware(req, mockRes, next);
      } catch (error) {
        console.error('[WebSocket] Error processing session:', error);
        ws.close(1011, 'Session processing error');
      }
    });

    // Heartbeat interval to detect dead connections
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws: WebSocket) => {
        const authWs = ws as AuthenticatedWebSocket;
        if (authWs.isAlive === false) {
          return authWs.terminate();
        }
        authWs.isAlive = false;
        authWs.ping();
      });
    }, 30000); // Every 30 seconds

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  // Send notification to specific user
  sendToUser(userId: number, notification: any) {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) {
      console.log(`[WebSocket] No active connections for user ${userId}`);
      return;
    }

    const message = JSON.stringify({
      type: 'notification',
      data: notification
    });

    userClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log(`[WebSocket] Sent notification to user ${userId}`);
  }

  // Send typed event to specific user
  sendEventToUser(userId: number, event: WebSocketEvent) {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) {
      console.log(`[WebSocket] No active connections for user ${userId}`);
      return;
    }

    const message = JSON.stringify(event);

    userClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log(`[WebSocket] Sent event ${event.type} to user ${userId}`);
  }

  // Send typed event to multiple users
  sendEventToUsers(userIds: number[], event: WebSocketEvent) {
    userIds.forEach(userId => this.sendEventToUser(userId, event));
  }

  // Broadcast to all connected clients (optional)
  broadcast(data: any) {
    const message = JSON.stringify(data);
    this.wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

export let notificationWS: NotificationWebSocketServer;

export function setupWebSocket(server: Server, sessionMiddleware: any) {
  notificationWS = new NotificationWebSocketServer(server, sessionMiddleware);
  console.log('[WebSocket] Notification WebSocket server initialized');
  return notificationWS;
}

// Helper function to send notifications to a specific user
export function sendNotificationToUser(userId: number, notification: any) {
  if (notificationWS) {
    notificationWS.sendToUser(userId, notification);
  } else {
    console.warn('[WebSocket] WebSocket server not initialized, cannot send notification');
  }
}
