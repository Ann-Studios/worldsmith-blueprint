import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { Card } from "./cards/Card";
import { Toolbar } from "./Toolbar";
import { Sidebar } from "./Sidebar";
import { useToast } from "@/hooks/use-toast";

export type CardType = "note" | "character" | "location" | "plot" | "item";

export interface CanvasCard {
  id: string;
  type: CardType;
  x: number;
  y: number;
  content: string;
  title?: string;
}

export const Canvas = () => {
  const [cards, setCards] = useState<CanvasCard[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();

  // Load cards from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("worldbuilding-canvas");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCards(parsed);
        toast({
          title: "Canvas loaded",
          description: "Your previous work has been restored.",
        });
      } catch (error) {
        console.error("Failed to load saved canvas:", error);
      }
    }
  }, []);

  // Save cards to localStorage whenever they change
  useEffect(() => {
    if (cards.length > 0) {
      localStorage.setItem("worldbuilding-canvas", JSON.stringify(cards));
    }
  }, [cards]);

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
  };

  const clearCanvas = () => {
    setCards([]);
    localStorage.removeItem("worldbuilding-canvas");
    toast({
      title: "Canvas cleared",
      description: "All cards have been removed.",
    });
  };

  const exportCanvas = () => {
    const dataStr = JSON.stringify(cards, null, 2);
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
        setCards(imported);
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
        <Toolbar onAddCard={addCard} />
        
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
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              {cards.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  onUpdate={updateCard}
                  onDelete={deleteCard}
                />
              ))}
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  );
};
