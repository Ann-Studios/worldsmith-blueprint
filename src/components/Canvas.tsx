import { useState, useEffect, useCallback } from "react";
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
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [commentPanelOpen, setCommentPanelOpen] = useState(false);
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { user, logout } = useAuth();

  // Replace the mock currentUser with the real authenticated user
  const currentUser = {
    id: user?._id || '',
    _id: user?._id || '',
    name: user?.name || '',
    email: user?.email || '',
    role: 'owner' as const,
    isOnline: true,
  };

  // Add logout button to toolbar or user menu
  const handleLogout = () => {
    logout();
    // Optional: Clear local storage data
    localStorage.removeItem('worldsmith-boards');
  };

  // Handle save function
  const handleSave = useCallback(async () => {
    if (!currentBoard) return;

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
  });

  // Load boards and current board data
  useEffect(() => {
    const loadBoards = async () => {
      setIsLoading(true);
      try {
        const boardsData = await api.get(`/boards?userId=${currentUser._id}`);
        if (boardsData.length > 0) {
          setBoards(boardsData);
          setCurrentBoard(boardsData[0]);
        } else {
          await createDefaultBoard();
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
          await createDefaultBoard();
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
      if (!boardId) return;

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
          const { cards: savedCards, connections: savedConnections, comments: savedComments } = JSON.parse(savedData);
          setCards(savedCards || []);
          setConnections(savedConnections || []);
          setComments(savedComments || []);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (currentBoard) {
      loadBoardData(currentBoard._id);
    }
  }, [currentBoard]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;

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
  };

  const addCard = async (type: CardType) => {
    if (!currentBoard) return;

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

  const exportCanvas = () => {
    const data = {
      board: currentBoard,
      cards,
      connections,
      comments,
      exportedAt: new Date().toISOString(),
      version: "1.0"
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `worldsmith-${currentBoard?.name || 'canvas'}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Canvas exported",
      description: "Your canvas has been downloaded as JSON.",
    });
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
      const newPermission: Permission = {
        userId: `user-${Date.now()}`, // In real app, this would be the actual user ID
        role,
        grantedBy: currentUser._id,
        grantedAt: new Date().toISOString(),
      };

      const updatedBoard = {
        ...currentBoard,
        permissions: [...currentBoard.permissions, newPermission],
        updatedAt: new Date().toISOString(),
      };

      setCurrentBoard(updatedBoard);
      setBoards(boards.map(b => b._id === currentBoard._id ? updatedBoard : b));

      // Update in server
      await api.put(`/boards/${currentBoard._id}`, { permissions: updatedBoard.permissions });

      toast({
        title: "User invited",
        description: `${email} has been added as ${role}`,
      });

    } catch (error) {
      console.error("Failed to invite user:", error);
      toast({
        title: "Invitation failed",
        description: "Could not invite user. Please try again.",
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

    // Delete from server in background
    try {
      await api.delete(`/connections/${connectionId}`);
    } catch (error) {
      console.error('Failed to delete connection from server:', error);
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
        onExport={exportCanvas}
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
          />
          <div className="flex items-center gap-4">
            {isLoading && (
              <div className="text-sm text-muted-foreground">
                Saving...
              </div>
            )}
            <CollaborationUsers
              users={onlineUsers}
              currentBoardId={currentBoard?._id}
              currentUser={currentUser}
              onInviteUser={handleInviteUser}
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

        <div className="flex-1 relative overflow-auto canvas-area">
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
                  />
                ))}
              </g>
            </svg>

            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              {cards.map((card) => (
                <div
                  key={card._id}
                  data-card-id={card._id} // Add data attribute for easier debugging
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
    </div>
  );
};