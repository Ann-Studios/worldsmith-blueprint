import { useState } from "react";
import { ChevronDown, Plus, Folder, MoreVertical } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Board } from "./Canvas";

interface BoardSelectorProps {
    boards: Board[];
    currentBoard: Board | null;
    onSelectBoard: (board: Board) => void;
    onCreateBoard: (name: string, templateId?: string) => void;
}

export const BoardSelector = ({ boards, currentBoard, onSelectBoard, onCreateBoard }: BoardSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newBoardName, setNewBoardName] = useState("");

    const handleCreateBoard = () => {
        if (newBoardName.trim()) {
            onCreateBoard(newBoardName.trim());
            setNewBoardName("");
            setIsCreating(false);
        }
    };

    return (
        <div className="relative">
            <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Folder className="w-4 h-4" />
                <span className="max-w-40 truncate">
                    {currentBoard?.name || "Select Board"}
                </span>
                <ChevronDown className="w-4 h-4" />
            </Button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-card border rounded-lg shadow-lg z-50">
                    <div className="p-2 border-b">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">Boards</h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsCreating(true)}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>

                        {isCreating && (
                            <div className="flex gap-2 mb-2">
                                <Input
                                    value={newBoardName}
                                    onChange={(e) => setNewBoardName(e.target.value)}
                                    placeholder="Board name"
                                    className="flex-1"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
                                />
                                <Button size="sm" onClick={handleCreateBoard}>
                                    Create
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="max-h-60 overflow-auto">
                        {boards.map((board) => (
                            <div
                                key={board.id}
                                className={`flex items-center justify-between p-2 hover:bg-accent cursor-pointer ${currentBoard?.id === board.id ? "bg-accent" : ""
                                    }`}
                                onClick={() => {
                                    onSelectBoard(board);
                                    setIsOpen(false);
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <Folder className="w-4 h-4" />
                                    <span className="truncate">{board.name}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreVertical className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};