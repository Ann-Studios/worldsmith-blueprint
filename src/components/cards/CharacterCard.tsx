import { Trash2, Users } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { CanvasCard } from "../Canvas";

interface CharacterCardProps {
  card: CanvasCard;
  onUpdate: (id: string, updates: Partial<CanvasCard>) => void;
  onDelete: (id: string) => void;
}

export const CharacterCard = ({ card, onUpdate, onDelete }: CharacterCardProps) => {
  return (
    <div className="w-80 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg shadow-lg hover:shadow-xl transition-shadow p-4 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <Input
            value={card.title || ""}
            onChange={(e) => onUpdate(card._id, { title: e.target.value })}
            className="font-semibold border-0 focus-visible:ring-0 p-0 h-auto bg-transparent"
            placeholder="Character Name"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card._id);
          }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      <Textarea
        value={card.content}
        onChange={(e) => onUpdate(card._id, { content: e.target.value })}
        className="min-h-[100px] resize-none border-0 focus-visible:ring-0 p-0 bg-transparent"
        placeholder="Character details, traits, backstory..."
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};
