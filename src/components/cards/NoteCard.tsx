import { Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { CanvasCard } from "../Canvas";

interface NoteCardProps {
  card: CanvasCard;
  onUpdate: (id: string, updates: Partial<CanvasCard>) => void;
  onDelete: (id: string) => void;
}

export const NoteCard = ({ card, onUpdate, onDelete }: NoteCardProps) => {
  return (
    <div className="w-64 bg-card border rounded-lg shadow-lg hover:shadow-xl transition-shadow p-4 group">
      <div className="flex justify-end mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card.id);
          }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      <Textarea
        value={card.content}
        onChange={(e) => onUpdate(card.id, { content: e.target.value })}
        className="min-h-[120px] resize-none border-0 focus-visible:ring-0 p-0"
        placeholder="Start typing..."
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};
