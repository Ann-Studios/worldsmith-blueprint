import { useEffect, useState, useCallback, useRef } from 'react';
import { CollaborationUser } from '@/components/CollaborationUsers';

interface WebSocketMessage {
    type: string;
    payload: any;
}

export const useWebSocket = (boardId: string, userId: string) => {
    const [onlineUsers, setOnlineUsers] = useState<CollaborationUser[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        if (!boardId || !userId || wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:3001'}?userId=${userId}&boardId=${boardId}`;
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);

                // Send initial presence
                sendMessage({
                    type: 'presence_update',
                    payload: {
                        boardId,
                        userId,
                        isOnline: true,
                        lastSeen: new Date().toISOString()
                    }
                });
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    handleMessage(message);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            wsRef.current.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);

                // Attempt to reconnect after 3 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, 3000);
            };

            wsRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);
            };
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
        }
    }, [boardId, userId]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsConnected(false);
    }, []);

    const sendMessage = useCallback((message: WebSocketMessage) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    const handleMessage = useCallback((message: WebSocketMessage) => {
        switch (message.type) {
            case 'presence_update':
                setOnlineUsers(prev => {
                    const existingUserIndex = prev.findIndex(user => user.id === message.payload.userId);
                    const updatedUser: CollaborationUser = {
                        id: message.payload.userId,
                        name: message.payload.name || 'Unknown User',
                        email: message.payload.email || '',
                        role: message.payload.role || 'viewer',
                        isOnline: message.payload.isOnline,
                        lastSeen: message.payload.lastSeen,
                        cursor: message.payload.cursor,
                        currentCard: message.payload.currentCard
                    };

                    if (existingUserIndex >= 0) {
                        if (message.payload.isOnline) {
                            // Update existing user
                            const updated = [...prev];
                            updated[existingUserIndex] = updatedUser;
                            return updated;
                        } else {
                            // Remove user
                            return prev.filter(user => user.id !== message.payload.userId);
                        }
                    } else if (message.payload.isOnline) {
                        // Add new user
                        return [...prev, updatedUser];
                    }

                    return prev;
                });
                break;

            case 'cursor_move':
                setOnlineUsers(prev =>
                    prev.map(user =>
                        user.id === message.payload.userId
                            ? { ...user, cursor: { x: message.payload.x, y: message.payload.y } }
                            : user
                    )
                );
                break;

            case 'user_activity':
                setOnlineUsers(prev =>
                    prev.map(user =>
                        user.id === message.payload.userId
                            ? { ...user, currentCard: message.payload.currentCard }
                            : user
                    )
                );
                break;
        }
    }, []);

    const broadcastCursorMove = useCallback((x: number, y: number) => {
        sendMessage({
            type: 'cursor_move',
            payload: { boardId, userId, x, y }
        });
    }, [boardId, userId, sendMessage]);

    const broadcastUserActivity = useCallback((activity: string, currentCard?: string) => {
        sendMessage({
            type: 'user_activity',
            payload: { boardId, userId, activity, currentCard }
        });
    }, [boardId, userId, sendMessage]);

    const updatePresence = useCallback((userData: Partial<CollaborationUser>) => {
        sendMessage({
            type: 'presence_update',
            payload: {
                boardId,
                userId,
                ...userData,
                isOnline: true,
                lastSeen: new Date().toISOString()
            }
        });
    }, [boardId, userId, sendMessage]);

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    // Send heartbeat every 30 seconds to maintain connection
    useEffect(() => {
        if (!isConnected) return;

        const heartbeat = setInterval(() => {
            sendMessage({
                type: 'heartbeat',
                payload: { boardId, userId }
            });
        }, 30000);

        return () => clearInterval(heartbeat);
    }, [isConnected, boardId, userId, sendMessage]);

    return {
        onlineUsers,
        isConnected,
        broadcastCursorMove,
        broadcastUserActivity,
        updatePresence,
        sendMessage
    };
};
