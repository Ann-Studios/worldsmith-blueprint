import { WebSocketServer } from 'ws';
import { Presence } from '../models/Presence';

export class CollaborationServer {
  private wss: WebSocketServer;
  private connections: Map<string, WebSocket> = new Map();

  constructor(server: import('http').Server | import('https').Server) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const userId = req.url?.split('userId=')[1];

      if (userId) {
        // Casting ws to 'any' to avoid TypeScript type incompatibility between 'ws' and DOM 'WebSocket'
        this.connections.set(userId, ws as any);
        this.setupMessageHandlers(ws as any, userId);
      }

      ws.on('close', () => {
        if (userId) {
          this.connections.delete(userId);
        }
      });
    });
  }

  private setupMessageHandlers(ws: any, userId: string) {
    ws.on('message', async (data: any) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'cursor_move':
            await this.handleCursorMove(userId, message.payload);
            break;
          case 'presence_update':
            await Presence.findOneAndUpdate(
              { userId, boardId: message.payload.boardId },
              { ...message.payload, lastSeen: new Date() },
              { upsert: true }
            );
            // Broadcast to other users in the same board
            this.broadcastToBoard(
              message.payload.boardId,
              {
                type: 'presence_update',
                payload: { userId, ...message.payload }
              },
              userId
            );
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

  private async handleCursorMove(userId: string, payload: { boardId: string; x: number; y: number }) {
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

  private broadcastToBoard(boardId: string, message: { type: string; payload: unknown }, excludeUserId?: string) {
    this.connections.forEach((ws, userId) => {
      if (userId !== excludeUserId) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}