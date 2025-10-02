import { StickyNote, Users, MapPin, BookOpen, Package } from "lucide-react";
import { Button } from "./ui/button";
import { CardType } from "./Canvas";

interface ToolbarProps {
  onAddCard: (type: CardType) => void;
}

export const Toolbar = ({ onAddCard }: ToolbarProps) => {
  const tools = [
    { type: "note" as CardType, icon: StickyNote, label: "Note" },
    { type: "character" as CardType, icon: Users, label: "Character" },
    { type: "location" as CardType, icon: MapPin, label: "Location" },
    { type: "plot" as CardType, icon: BookOpen, label: "Plot" },
    { type: "item" as CardType, icon: Package, label: "Item" },
  ];

  return (
    <div className="h-16 border-b bg-card flex items-center px-6 gap-2">
      <div className="flex items-center gap-2">
        {tools.map((tool) => (
          <Button
            key={tool.type}
            variant="ghost"
            size="sm"
            onClick={() => onAddCard(tool.type)}
            className="gap-2"
          >
            <tool.icon className="w-4 h-4" />
            <span>{tool.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
