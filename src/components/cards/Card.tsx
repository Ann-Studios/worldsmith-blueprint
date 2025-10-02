import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CanvasCard } from "../Canvas";
import { NoteCard } from "./NoteCard";
import { CharacterCard } from "./CharacterCard";
import { LocationCard } from "./LocationCard";
import { PlotCard } from "./PlotCard";
import { ItemCard } from "./ItemCard";

interface CardProps {
  card: CanvasCard;
  onUpdate: (id: string, updates: Partial<CanvasCard>) => void;
  onDelete: (id: string) => void;
}

export const Card = ({ card, onUpdate, onDelete }: CardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });

  const style = {
    position: "absolute" as const,
    left: `${card.x}px`,
    top: `${card.y}px`,
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const renderCard = () => {
    switch (card.type) {
      case "note":
        return <NoteCard card={card} onUpdate={onUpdate} onDelete={onDelete} />;
      case "character":
        return <CharacterCard card={card} onUpdate={onUpdate} onDelete={onDelete} />;
      case "location":
        return <LocationCard card={card} onUpdate={onUpdate} onDelete={onDelete} />;
      case "plot":
        return <PlotCard card={card} onUpdate={onUpdate} onDelete={onDelete} />;
      case "item":
        return <ItemCard card={card} onUpdate={onUpdate} onDelete={onDelete} />;
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {renderCard()}
    </div>
  );
};
