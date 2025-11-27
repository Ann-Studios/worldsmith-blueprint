import { useState, useEffect, useCallback, useMemo } from "react";
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Card } from "./cards/Card";
import { Toolbar } from "./Toolbar";
import { Sidebar } from "./Sidebar";
import { useToast } from "@/hooks/use-toast";
import { ConnectionLine } from "./ConnectionLine";
import { BoardSelector } from "./BoardSelector";
import { CollaborationUsers } from "./CollaborationUsers";
import { CommentPanel } from "./CommentPanel";
import { SearchPanel } from "./SearchPanel";
import { ExportDialog } from "./ExportDialog";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useWebSocket } from "@/hooks/useWebSocket";
import { api } from "@/config/api";
import { useAuth } from '@/hooks/useAuth';

export type CardType = "note" | "character" | "location" | "plot" | "item";

export interface CanvasCard {
  _id: string;
  type: CardType;
  x: number;
  y: number;
  content: string;
  title?: string;
  tags: string[];
  attachments: Attachment[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  boardId: string;
}

export interface Connection {
  _id: string;
  id: string;
  fromCardId: string;
  toCardId: string;
  label?: string;
  type: "relationship" | "dependency" | "timeline" | "custom";
  color?: string;
  createdBy: string;
  boardId: string;
}

export interface Comment {
  _id: string;
  cardId: string;
  content: string;
  createdBy: string;
  createdAt: string;
  mentions: string[];
  resolved: boolean;
  x?: number;
  y?: number;
  boardId: string;
}

export interface Attachment {
  _id: string;
  cardId: string;
  filename: string;
  url: string;
  type: "image" | "file";
  uploadedBy: string;
  uploadedAt: string;
  size: number;
}

export interface Permission {
  userId: string;
  role: "owner" | "editor" | "viewer";
  grantedBy: string;
  grantedAt: string;
}

export interface Board {
  _id: string;
  name: string;
  description?: string;
  parentFolderId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  permissions: Permission[];
  tags: string[];
  templateId?: string;
  isPublic: boolean;
}

export const Canvas = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [cards, setCards] = useState<CanvasCard[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [connectionMode, setConnectionMode] = useState(false);
  const [selectedCardForConnection, setSelectedCardForConnection] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [commentPanelOpen, setCommentPanelOpen] = useState(false);
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { user, logout } = useAuth();

  // Initialize WebSocket collaboration
  const { onlineUsers, isConnected, broadcastCursorMove, broadcastUserActivity, updatePresence } = useWebSocket(
    currentBoard?._id || '',
    user?._id || ''
  );

  // Replace the mock currentUser with the real authenticated user
  const currentUser = {
    id: user?._id || '',
    _id: user?._id || '',
    name: user?.name || '',
    email: user?.email || '',
    role: 'owner' as const,
    isOnline: true,
  };

  // Ensure current user always appears in the collaborators list
  const mergedUsers = useMemo(() => {
    const hasCurrent = onlineUsers?.some(u => u.id === currentUser.id);
    const list = hasCurrent ? onlineUsers : [...(onlineUsers || []), currentUser];
    // Deduplicate by id just in case
    const dedupedMap = new Map(list.map(u => [u.id, { ...u, isOnline: true }]));
    return Array.from(dedupedMap.values());
  }, [onlineUsers, currentUser.id]);

  // Update presence when user data changes
  useEffect(() => {
    if (currentBoard && user) {
      updatePresence({
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'owner',
        isOnline: true
      });
    }
  }, [currentBoard, user, updatePresence]);

  // Track cursor movement for collaboration
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (currentBoard && user) {
        broadcastCursorMove(e.clientX, e.clientY);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [currentBoard, user, broadcastCursorMove]);

  // Add logout button to toolbar or user menu
  const handleLogout = () => {
    logout();
    // Optional: Clear local storage data
    localStorage.removeItem('worldsmith-boards');
  };

  // Handle save function
  const handleSave = useCallback(async () => {
    if (!currentBoard) {
      console.warn('⚠️ No current board selected for save');
      return;
    }

    setIsLoading(true);
    try {
      const saveData = {
        board: currentBoard,
        cards,
        connections,
        comments,
        updatedAt: new Date().toISOString()
      };

      await api.put(`/boards/${currentBoard._id}`, saveData);

      toast({
        title: "Saved to Cloud",
        description: "Your work has been saved to the cloud.",
      });
    } catch (error) {
      console.error('Failed to save to server:', error);

      // Fallback to localStorage
      const boardData = { cards, connections, comments };
      localStorage.setItem(`worldsmith-board-${currentBoard._id}`, JSON.stringify(boardData));
      localStorage.setItem("worldsmith-boards", JSON.stringify(boards));

      toast({
        title: "Saved Locally",
        description: "Your work has been saved to browser storage.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [cards, connections, comments, currentBoard, boards, toast]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onAddNote: () => addCard("note"),
    onAddCharacter: () => addCard("character"),
    onAddLocation: () => addCard("location"),
    onAddPlot: () => addCard("plot"),
    onAddItem: () => addCard("item"),
    onToggleConnection: () => setConnectionMode(!connectionMode),
    onSearch: () => setSearchPanelOpen(true),
    onComment: () => setCommentPanelOpen(true),
    onSave: handleSave,
    onDeleteSelected: () => handleDeleteSelected(),
  });

  // Load boards and current board data
  useEffect(() => {
    if (!currentUser._id) {
      console.warn('⚠️ User ID not available, skipping board load');
      return;
    }

    const loadBoards = async () => {
      setIsLoading(true);
      try {
        const boardsData = await api.get(`/boards?userId=${currentUser._id}`);
        if (boardsData && boardsData.length > 0) {
          setBoards(boardsData);
          setCurrentBoard(boardsData[0]);
        } else {
          // Only create default board if user has never created any boards
          const hasCreatedBoards = localStorage.getItem('worldsmith-has-created-boards');
          if (!hasCreatedBoards) {
            await createDefaultBoard();
            localStorage.setItem('worldsmith-has-created-boards', 'true');
          }
        }
      } catch (error) {
        console.error('Failed to load boards from server:', error);
        // Fallback to localStorage
        const savedBoards = localStorage.getItem("worldsmith-boards");
        if (savedBoards) {
          const parsed = JSON.parse(savedBoards);
          setBoards(parsed);
          setCurrentBoard(parsed[0]);
        } else {
          // Only create default board if user has never created any boards
          const hasCreatedBoards = localStorage.getItem('worldsmith-has-created-boards');
          if (!hasCreatedBoards) {
            await createDefaultBoard();
            localStorage.setItem('worldsmith-has-created-boards', 'true');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    const createDefaultBoard = async () => {
      const defaultBoard: Board = {
        _id: `board-${Date.now()}`,
        name: "My First Board",
        description: "Start building your world",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser._id,
        permissions: [{
          userId: currentUser._id,
          role: "owner",
          grantedBy: currentUser._id,
          grantedAt: new Date().toISOString(),
        }],
        tags: [],
        isPublic: false,
      };

      try {
        await api.post('/boards', defaultBoard);
        setBoards([defaultBoard]);
        setCurrentBoard(defaultBoard);
        localStorage.setItem("worldsmith-boards", JSON.stringify([defaultBoard]));
      } catch (error) {
        console.error('Failed to create default board:', error);
        // Fallback to localStorage only
        setBoards([defaultBoard]);
        setCurrentBoard(defaultBoard);
        localStorage.setItem("worldsmith-boards", JSON.stringify([defaultBoard]));
      }
    };

    loadBoards();
  }, [currentUser._id]);

  useEffect(() => {
    const loadBoardData = async (boardId: string) => {
      if (!boardId) {
        console.warn('⚠️ No board ID provided for loading data');
        return;
      }

      setIsLoading(true);
      try {
        const boardData = await api.get(`/boards/${boardId}/data`);
        console.log('📥 Loaded board data:', {
          cardsCount: boardData.cards?.length || 0,
          connectionsCount: boardData.connections?.length || 0,
          commentsCount: boardData.comments?.length || 0
        });

        setCards(boardData.cards || []);
        setConnections(boardData.connections || []);
        setComments(boardData.comments || []);
      } catch (error) {
        console.error('Failed to load board data from server:', error);
        // Fallback to localStorage
        const savedData = localStorage.getItem(`worldsmith-board-${boardId}`);
        if (savedData) {
          try {
            const { cards: savedCards, connections: savedConnections, comments: savedComments } = JSON.parse(savedData);
            setCards(savedCards || []);
            setConnections(savedConnections || []);
            setComments(savedComments || []);
          } catch (parseError) {
            console.error('Failed to parse saved board data:', parseError);
            setCards([]);
            setConnections([]);
            setComments([]);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (currentBoard?._id) {
      loadBoardData(currentBoard._id);
    }
  }, [currentBoard?._id]);

  // Fix: Use undefined instead of null for spacebar exclusion
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event, { currentNode }) => {
        // Exclude spacebar from keyboard sensor completely
        if (event.code === 'Space' || event.key === ' ') {
          return undefined;
        }
        return sortableKeyboardCoordinates(event, { currentNode });
      },
    })
  );

  // Fix: Add null check for currentBoard
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;

    if (!currentBoard) {
      console.warn('⚠️ Cannot drag: no current board selected');
      return;
    }

    console.log('🔄 Drag end:', { activeId: active.id, delta });

    setCards((cards) =>
      cards.map((card) =>
        card._id === active.id
          ? {
            ...card,
            x: card.x + delta.x,
            y: card.y + delta.y,
            updatedAt: new Date().toISOString()
          }
          : card
      )
    );

    // Save updated card position to server in background
    const updatedCard = cards.find(c => c._id === active.id);
    if (updatedCard) {
      try {
        api.put(`/cards/${active.id}`, {
          x: updatedCard.x + delta.x,
          y: updatedCard.y + delta.y
        });
      } catch (error) {
        console.error('Failed to save card position to server:', error);
      }
    }
  };

  const addCard = async (type: CardType) => {
    if (!currentBoard) {
      console.warn('⚠️ Cannot add card: no current board selected');
      return;
    }

    const cardId = `card-${Date.now()}`;
    console.log('➕ Creating new card:', { cardId, type });

    const newCard: CanvasCard = {
      _id: cardId,
      type,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      content: type === "note" ? "Start typing..." : "",
      title: type !== "note" ? `New ${type}` : undefined,
      tags: [],
      attachments: [],
      createdBy: currentUser._id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      boardId: currentBoard._id,
    };

    setCards(prevCards => {
      const updatedCards = [...prevCards, newCard];
      console.log('📋 Cards after add:', updatedCards.map(c => ({ id: c._id, type: c.type })));
      return updatedCards;
    });

    // Save to server in background
    try {
      await api.post('/cards', newCard);
      console.log('✅ Card saved to server:', cardId);
    } catch (error) {
      console.error('Failed to save card to server:', error);
    }
  };

  const updateCard = async (id: string, updates: Partial<CanvasCard>) => {
    console.log('🔄 updateCard called:', { id, updates });

    // Validate ID
    if (!id || id === 'undefined') {
      console.error('❌ Invalid card ID in updateCard:', id);
      return;
    }

    // Check if card exists in local state
    const cardExists = cards.find(card => card._id === id);
    if (!cardExists) {
      console.error('❌ Card not found in local state:', id);
      console.log('📋 Available cards:', cards.map(c => c._id));
      return;
    }

    setCards((cards) =>
      cards.map((card) =>
        card._id === id
          ? {
            ...card,
            ...updates,
            updatedAt: new Date().toISOString(),
            version: card.version + 1
          }
          : card
      )
    );

    // Update in server in background
    try {
      await api.put(`/cards/${id}`, updates);
      console.log('✅ Card updated on server:', id);
    } catch (error) {
      console.error('Failed to update card in server:', error);
    }
  };

  const deleteCard = async (id: string) => {
    console.log('🗑️ Deleting card:', id);

    setCards((cards) => cards.filter((card) => card._id !== id));
    setConnections((conns) =>
      conns.filter((conn) => conn.fromCardId !== id && conn.toCardId !== id)
    );
    setComments((comments) => comments.filter((comment) => comment.cardId !== id));

    // Delete from server in background
    try {
      await api.delete(`/cards/${id}`);
      console.log('✅ Card deleted from server:', id);
    } catch (error) {
      console.error('Failed to delete card from server:', error);
    }
  };

  const handleCardClick = async (cardId: string) => {
    if (!connectionMode) return;

    if (!selectedCardForConnection) {
      setSelectedCardForConnection(cardId);
      toast({
        title: "First card selected",
        description: "Click another card to create a connection.",
      });
    } else if (selectedCardForConnection === cardId) {
      setSelectedCardForConnection(null);
      toast({
        title: "Selection cleared",
        description: "Click a card to start again.",
      });
    } else {
      const newConnection: Connection = {
        _id: `conn-${Date.now()}`,
        id: `conn-${Date.now()}`,
        fromCardId: selectedCardForConnection,
        toCardId: cardId,
        type: "relationship",
        createdBy: currentUser._id,
        boardId: currentBoard?._id || "",
      };
      setConnections([...connections, newConnection]);
      setSelectedCardForConnection(null);
      setConnectionMode(false);

      // Save to server in background
      try {
        await api.post('/connections', newConnection);
      } catch (error) {
        console.error('Failed to save connection to server:', error);
      }

      toast({
        title: "Connection created",
        description: "Cards have been linked.",
      });
    }
  };

  const createBoard = async (name: string, templateId?: string) => {
    const newBoard: Board = {
      _id: `board-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser._id,
      permissions: [{
        userId: currentUser._id,
        role: "owner",
        grantedBy: currentUser._id,
        grantedAt: new Date().toISOString(),
      }],
      tags: [],
      isPublic: false,
      templateId,
    };

    try {
      await api.post('/boards', newBoard);
      setBoards([...boards, newBoard]);
      setCurrentBoard(newBoard);

      // Clear current data for new board
      setCards([]);
      setConnections([]);
      setComments([]);
    } catch (error) {
      console.error('Failed to create board in server:', error);
      // Fallback to localStorage
      setBoards([...boards, newBoard]);
      setCurrentBoard(newBoard);
      setCards([]);
      setConnections([]);
      setComments([]);
      localStorage.setItem("worldsmith-boards", JSON.stringify([...boards, newBoard]));
    }
  };

  const deleteBoard = async (boardId: string) => {
    if (!boardId) return;

    try {
      // Delete from server
      await api.delete(`/boards/${boardId}`);

      // Update local state
      const updatedBoards = boards.filter(board => board._id !== boardId);
      setBoards(updatedBoards);

      // If we deleted the current board, switch to another one
      if (currentBoard?._id === boardId) {
        if (updatedBoards.length > 0) {
          setCurrentBoard(updatedBoards[0]);
        } else {
          setCurrentBoard(null);
          setCards([]);
          setConnections([]);
          setComments([]);
        }
      }

      // Update localStorage
      localStorage.setItem("worldsmith-boards", JSON.stringify(updatedBoards));
      localStorage.removeItem(`worldsmith-board-${boardId}`);

      toast({
        title: "Board deleted",
        description: "The board has been permanently deleted.",
      });
    } catch (error) {
      console.error('Failed to delete board:', error);
      toast({
        title: "Delete failed",
        description: "Could not delete the board. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearCanvas = () => {
    setCards([]);
    setConnections([]);
    setComments([]);
    if (currentBoard) {
      localStorage.removeItem(`worldsmith-board-${currentBoard._id}`);

      // Clear from server in background
      try {
        api.post(`/boards/${currentBoard._id}/clear`, {});
      } catch (error) {
        console.error('Failed to clear canvas in server:', error);
      }
    }
    toast({
      title: "Canvas cleared",
      description: "All cards and connections have been removed.",
    });
  };

  const exportCanvasData = () => {
    return {
      board: currentBoard,
      cards,
      connections,
      comments,
      exportedAt: new Date().toISOString(),
      version: "1.0"
    };
  };

  const importCanvas = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (imported.cards) {
          setCards(imported.cards);
          setConnections(imported.connections || []);
          setComments(imported.comments || []);

          // Save imported data to server
          if (currentBoard) {
            try {
              await api.post(`/boards/${currentBoard._id}/import`, {
                cards: imported.cards,
                connections: imported.connections,
                comments: imported.comments
              });
            } catch (error) {
              console.error('Failed to save imported data to server:', error);
            }
          }
        } else {
          // Legacy format (just cards)
          setCards(imported);
        }
        toast({
          title: "Canvas imported",
          description: "Your canvas has been loaded from file.",
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Could not read the file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleInviteUser = async (email: string, role: "editor" | "viewer") => {
    if (!currentBoard) return;

    try {
      // Call the new invitation endpoint
      const response = await api.post(`/boards/${currentBoard._id}/invite`, {
        email,
        role
      });

      if (response.emailError) {
        toast({
          title: "User added to board",
          description: `${email} has been added as ${role}, but email could not be sent: ${response.emailError}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invitation sent",
          description: `${email} has been invited as ${role}. They will receive an email invitation.`,
        });
      }

    } catch (error) {
      console.error("Failed to invite user:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Invitation failed",
        description: `Could not send invitation: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  // Helper function to extract mentions from comment content
  const extractMentions = (content: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = content.match(mentionRegex);
    return matches ? matches.map(match => match.substring(1)) : [];
  };

  const deleteConnection = async (connectionId: string) => {
    setConnections(connections => connections.filter(conn => conn._id !== connectionId));
    setSelectedConnection(null);

    // Delete from server in background
    try {
      await api.delete(`/connections/${connectionId}`);
    } catch (error) {
      console.error('Failed to delete connection from server:', error);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedConnection) {
      deleteConnection(selectedConnection);
    }
  };

  const updateConnection = async (connectionId: string, updates: Partial<Connection>) => {
    setConnections(connections =>
      connections.map(conn =>
        conn._id === connectionId ? { ...conn, ...updates } : conn
      )
    );

    // Update in server in background
    try {
      await api.put(`/connections/${connectionId}`, updates);
    } catch (error) {
      console.error('Failed to update connection in server:', error);
    }
  };

  const addComment = async (cardId: string, content: string) => {
    const newComment: Comment = {
      _id: `comment-${Date.now()}`,
      cardId,
      content,
      createdBy: currentUser._id,
      createdAt: new Date().toISOString(),
      mentions: extractMentions(content),
      resolved: false,
      boardId: currentBoard?._id || "",
    };

    setComments([...comments, newComment]);

    // Save to server in background
    try {
      await api.post('/comments', newComment);
    } catch (error) {
      console.error('Failed to save comment to server:', error);
    }
  };

  // Debug effect to log card state changes
  useEffect(() => {
    console.log('📊 Current cards state:', cards.map(card => ({
      id: card._id,
      type: card.type,
      content: card.content.substring(0, 20) + '...'
    })));
  }, [cards]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas-bg">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onClear={clearCanvas}
        onExport={() => setExportDialogOpen(true)}
        onImport={importCanvas}
        onSave={handleSave}
      />

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <BoardSelector
            boards={boards}
            currentBoard={currentBoard}
            onSelectBoard={setCurrentBoard}
            onCreateBoard={createBoard}
            onDeleteBoard={deleteBoard}
          />
          <div className="flex items-center gap-4">
            {isLoading && (
              <div className="text-sm text-muted-foreground">
                Saving...
              </div>
            )}
            <CollaborationUsers
              users={mergedUsers}
              currentBoardId={currentBoard?._id}
              currentUser={currentUser}
              onInviteUser={handleInviteUser}
              onNavigateToProfile={(userId) => {
                // Navigate to profile page
                window.location.href = '/profile';
              }}
              isConnected={isConnected}
            />
            <Toolbar
              onAddCard={addCard}
              connectionMode={connectionMode}
              onToggleConnectionMode={() => {
                setConnectionMode(!connectionMode);
                setSelectedCardForConnection(null);
                if (!connectionMode) {
                  toast({
                    title: "Connection mode enabled",
                    description: "Click two cards to connect them.",
                  });
                } else {
                  toast({
                    title: "Connection mode disabled",
                  });
                }
              }}
              onToggleComments={() => setCommentPanelOpen(!commentPanelOpen)}
              onToggleSearch={() => setSearchPanelOpen(!searchPanelOpen)}
            />
          </div>
        </div>

        <div className="flex-1 relative overflow-auto canvas-area" id="canvas-export-area">
          <div className="absolute inset-0 min-w-[200%] min-h-[200%] bg-grid bg-24px">
            <svg className="absolute inset-0 w-full h-full pointer-events-none connection-layer">
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="hsl(var(--ring))" className="opacity-40" />
                </marker>
              </defs>
              <g className="pointer-events-auto">
                {connections.map((connection) => (
                  <ConnectionLine
                    key={connection._id}
                    connection={connection}
                    cards={cards}
                    onDelete={deleteConnection}
                    onUpdate={updateConnection}
                    onSelect={() => setSelectedConnection(connection._id)}
                    isSelected={selectedConnection === connection._id}
                  />
                ))}
              </g>
            </svg>

            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              {cards.map((card) => (
                <div
                  key={card._id}
                  data-card-id={card._id}
                  onClick={() => handleCardClick(card._id)}
                  className={selectedCardForConnection === card._id ? "ring-4 ring-ring rounded-lg" : ""}
                >
                  <Card
                    card={card}
                    onUpdate={updateCard}
                    onDelete={deleteCard}
                    onAddComment={addComment}
                  />
                </div>
              ))}
            </DndContext>
          </div>
        </div>
      </div>

      {commentPanelOpen && (
        <CommentPanel
          comments={comments}
          cards={cards}
          onClose={() => setCommentPanelOpen(false)}
          onResolveComment={(id) => setComments(comments =>
            comments.map(c => c._id === id ? { ...c, resolved: true } : c)
          )}
          onDeleteComment={(id) => setComments(comments =>
            comments.filter(c => c._id !== id)
          )}
          onNavigateToCard={(cardId) => {
            const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
            if (cardElement) {
              cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              cardElement.classList.add('ring-4', 'ring-ring');
              setTimeout(() => {
                cardElement.classList.remove('ring-4', 'ring-ring');
              }, 2000);
            }
          }}
        />
      )}

      {searchPanelOpen && (
        <SearchPanel
          cards={cards}
          connections={connections}
          comments={comments}
          onClose={() => setSearchPanelOpen(false)}
          onSelectCard={(cardId) => {
            const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
            if (cardElement) {
              cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              cardElement.classList.add('ring-4', 'ring-ring');
              setTimeout(() => {
                cardElement.classList.remove('ring-4', 'ring-ring');
              }, 2000);
            }
          }}
        />
      )}

      <ExportDialog
        isOpen={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        canvasElement={document.getElementById('canvas-export-area')}
        boardName={currentBoard?.name || 'canvas'}
        data={exportCanvasData()}
      />
    </div>
  );
};