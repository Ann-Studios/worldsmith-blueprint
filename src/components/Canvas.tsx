import { useState } from "react";
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { Card } from "./cards/Card";
import { Toolbar } from "./Toolbar";
import { Sidebar } from "./Sidebar";

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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas-bg">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
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
