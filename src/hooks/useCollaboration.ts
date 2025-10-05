import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CollaborationUser } from "./CollaborationUsers";

export const useCollaboration = (boardId: string, currentUserId: string) => {
  const [onlineUsers, setOnlineUsers] = useState<CollaborationUser[]>([]);
  const [userCursors, setUserCursors] = useState<Record<string, { x: number; y: number }>>({});
  const [userActivities, setUserActivities] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Subscribe to presence channel for real-time collaboration
  useEffect(() => {
    if (!boardId || !currentUserId) return;

    const channel = supabase.channel(`board:${boardId}`);

    // Track user presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat().map((presence: any) => ({
          id: presence.user.id,
          name: presence.user.name,
          email: presence.user.email,
          avatar: presence.user.avatar,
          role: presence.user.role,
          isOnline: true,
          cursor: presence.cursor,
          currentCard: presence.currentCard,
        }));
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresence }) => {
        toast({
          title: "User joined",
          description: `${newPresence.user.name} joined the board`,
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresence }) => {
        toast({
          title: "User left",
          description: `${leftPresence.user.name} left the board`,
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          await channel.track({
            user: {
              id: currentUserId,
              name: "Current User", // Replace with actual user data
              email: "user@example.com",
              role: "owner",
            },
            cursor: { x: 0, y: 0 },
            currentCard: null,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [boardId, currentUserId, toast]);

  // Subscribe to cursor movements
  useEffect(() => {
    if (!boardId) return;

    const channel = supabase.channel(`cursors:${boardId}`);

    channel
      .on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
        setUserCursors(prev => ({
          ...prev,
          [payload.userId]: { x: payload.x, y: payload.y }
        }));
      })
      .on('broadcast', { event: 'user_activity' }, ({ payload }) => {
        setUserActivities(prev => ({
          ...prev,
          [payload.userId]: payload.activity
        }));
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [boardId]);

  const broadcastCursorMove = useCallback((x: number, y: number) => {
    if (!boardId || !currentUserId) return;

    const channel = supabase.channel(`cursors:${boardId}`);
    channel.send({
      type: 'broadcast',
      event: 'cursor_move',
      payload: { userId: currentUserId, x, y }
    });
  }, [boardId, currentUserId]);

  const broadcastUserActivity = useCallback((activity: string) => {
    if (!boardId || !currentUserId) return;

    const channel = supabase.channel(`cursors:${boardId}`);
    channel.send({
      type: 'broadcast',
      event: 'user_activity',
      payload: { userId: currentUserId, activity }
    });
  }, [boardId, currentUserId]);

  return {
    onlineUsers,
    userCursors,
    userActivities,
    broadcastCursorMove,
    broadcastUserActivity,
  };
};