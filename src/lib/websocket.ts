import WebSocket from 'ws';
import { Presence } from '../models/Presence';

export class CollaborationServer {
  private wss: WebSocket.Server;
  private connections: Map<string, WebSocket> = new Map();

  constructor(server: any) {
    this.wss = new WebSocket.Server({ server });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const userId = req.url?.split('userId=')[1];
      
      if (userId) {
        this.connections.set(userId, ws);
        this.setupMessageHandlers(ws, userId);
      }

      ws.on('close', () => {
        this.connections.delete(userId);
      });
    });
  }

  private setupMessageHandlers(ws: WebSocket, userId: string) {
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'cursor_move':
            await this.handleCursorMove(userId, message.payload);
            break;
          case 'presence_update':
            await this.handlePresenceUpdate(userId, message.payload);
            break;
          case 'card_update':
            await this.broadcastToBoard(message.payload.boardId, message, userId);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
  }

  private async handleCursorMove(userId: string, payload: any) {
    await Presence.findOneAndUpdate(
      { userId, boardId: payload.boardId },
      {
        cursorX: payload.x,
        cursorY: payload.y,
        lastSeen: new Date()
      },
      { upsert: true }
    );

    // Broadcast to other users in the same board
    this.broadcastToBoard(payload.boardId, {
      type: 'cursor_move',
      payload: { userId, ...payload }
    }, userId);
  }

  private broadcastToBoard(boardId: string, message: any, excludeUserId?: string) {
    this.connections.forEach((ws, userId) => {
      if (userId !== excludeUserId) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}