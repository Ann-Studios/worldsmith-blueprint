import { Plus, Link, MessageSquare, Search } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface ToolbarProps {
  onAddCard: (type: "note" | "character" | "location" | "plot" | "item") => void;
  connectionMode: boolean;
  onToggleConnectionMode: () => void;
  onToggleComments?: () => void;
  onToggleSearch?: () => void;
}

export const Toolbar = ({
  onAddCard,
  connectionMode,
  onToggleConnectionMode,
  onToggleComments,
  onToggleSearch
}: ToolbarProps) => {
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Card
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onAddCard("note")}>
            Note
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddCard("character")}>
            Character
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddCard("location")}>
            Location
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddCard("plot")}>
            Plot
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddCard("item")}>
            Item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant={connectionMode ? "default" : "outline"}
        onClick={onToggleConnectionMode}
      >
        <Link className="w-4 h-4 mr-2" />
        Connect
      </Button>

      {onToggleComments && (
        <Button variant="outline" size="icon" onClick={onToggleComments}>
          <MessageSquare className="w-4 h-4" />
        </Button>
      )}

      {onToggleSearch && (
        <Button variant="outline" size="icon" onClick={onToggleSearch}>
          <Search className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};