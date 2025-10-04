import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { Card } from "./cards/Card";
import { Toolbar } from "./Toolbar";
import { Sidebar } from "./Sidebar";
import { useToast } from "@/hooks/use-toast";
import { ConnectionLine } from "./ConnectionLine";

export type CardType = "note" | "character" | "location" | "plot" | "item";

export interface CanvasCard {
  id: string;
  type: CardType;
  x: number;
  y: number;
  content: string;
  title?: string;
}

export interface Connection {
  id: string;
  fromCardId: string;
  toCardId: string;
}

export const Canvas = () => {
  const [cards, setCards] = useState<CanvasCard[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionMode, setConnectionMode] = useState(false);
  const [selectedCardForConnection, setSelectedCardForConnection] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();

  // Load cards and connections from localStorage on mount
  useEffect(() => {
    const savedCards = localStorage.getItem("worldbuilding-canvas");
    const savedConnections = localStorage.getItem("worldbuilding-connections");
    
    if (savedCards) {
      try {
        const parsed = JSON.parse(savedCards);
        setCards(parsed);
      } catch (error) {
        console.error("Failed to load saved canvas:", error);
      }
    }
    
    if (savedConnections) {
      try {
        const parsed = JSON.parse(savedConnections);
        setConnections(parsed);
      } catch (error) {
        console.error("Failed to load saved connections:", error);
      }
    }
    
    if (savedCards || savedConnections) {
      toast({
        title: "Canvas loaded",
        description: "Your previous work has been restored.",
      });
    }
  }, []);

  // Save cards to localStorage whenever they change
  useEffect(() => {
    if (cards.length > 0) {
      localStorage.setItem("worldbuilding-canvas", JSON.stringify(cards));
    }
  }, [cards]);

  // Save connections to localStorage whenever they change
  useEffect(() => {
    if (connections.length > 0) {
      localStorage.setItem("worldbuilding-connections", JSON.stringify(connections));
    }
  }, [connections]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    
    setCards((cards) =>
      cards.map((card) =>
        card.id === active.id
          ? { ...card, x: card.x + delta.x, y: card.y + delta.y }
          : card
      )
    );
  };

  const addCard = (type: CardType) => {
    const newCard: CanvasCard = {
      id: `card-${Date.now()}`,
      type,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      content: type === "note" ? "Start typing..." : "",
      title: type !== "note" ? `New ${type}` : undefined,
    };
    setCards([...cards, newCard]);
  };

  const updateCard = (id: string, updates: Partial<CanvasCard>) => {
    setCards((cards) =>
      cards.map((card) => (card.id === id ? { ...card, ...updates } : card))
    );
  };

  const deleteCard = (id: string) => {
    setCards((cards) => cards.filter((card) => card.id !== id));
    // Also delete any connections to/from this card
    setConnections((conns) =>
      conns.filter((conn) => conn.fromCardId !== id && conn.toCardId !== id)
    );
  };

  const handleCardClick = (cardId: string) => {
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
      // Create connection
      const newConnection: Connection = {
        id: `conn-${Date.now()}`,
        fromCardId: selectedCardForConnection,
        toCardId: cardId,
      };
      setConnections([...connections, newConnection]);
      setSelectedCardForConnection(null);
      setConnectionMode(false);
      toast({
        title: "Connection created",
        description: "Cards have been linked.",
      });
    }
  };

  const deleteConnection = (id: string) => {
    setConnections((conns) => conns.filter((conn) => conn.id !== id));
  };

  const clearCanvas = () => {
    setCards([]);
    setConnections([]);
    localStorage.removeItem("worldbuilding-canvas");
    localStorage.removeItem("worldbuilding-connections");
    toast({
      title: "Canvas cleared",
      description: "All cards and connections have been removed.",
    });
  };

  const exportCanvas = () => {
    const data = { cards, connections };
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `worldbuilding-canvas-${Date.now()}.json`;
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
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (imported.cards) {
          setCards(imported.cards);
          setConnections(imported.connections || []);
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas-bg">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onClear={clearCanvas}
        onExport={exportCanvas}
        onImport={importCanvas}
      />
      
      <div className="flex-1 flex flex-col">
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
            }
          }}
        />
        
        <div className="flex-1 relative overflow-auto">
          <div 
            className="absolute inset-0 min-w-[200%] min-h-[200%]"
            style={{
              backgroundImage: `
                linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0, 0 0",
            }}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
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
                    key={connection.id}
                    connection={connection}
                    cards={cards}
                    onDelete={deleteConnection}
                  />
                ))}
              </g>
            </svg>
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              {cards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={selectedCardForConnection === card.id ? "ring-4 ring-ring rounded-lg" : ""}
                >
                  <Card
                    card={card}
                    onUpdate={updateCard}
                    onDelete={deleteCard}
                  />
                </div>
              ))}
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  );
};
