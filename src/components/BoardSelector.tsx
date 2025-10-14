import { useState } from "react";
import { ChevronDown, Plus, Folder, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Board } from "./Canvas";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "./ui/alert-dialog";

interface BoardSelectorProps {
    boards: Board[];
    currentBoard: Board | null;
    onSelectBoard: (board: Board) => void;
    onCreateBoard: (name: string, templateId?: string) => void;
    onDeleteBoard: (boardId: string) => void;
}

export const BoardSelector = ({ boards, currentBoard, onSelectBoard, onCreateBoard, onDeleteBoard }: BoardSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newBoardName, setNewBoardName] = useState("");
    const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);

    const handleCreateBoard = () => {
        if (newBoardName.trim()) {
            onCreateBoard(newBoardName.trim());
            setNewBoardName("");
            setIsCreating(false);
        }
    };

    const handleDeleteBoard = () => {
        if (boardToDelete) {
            onDeleteBoard(boardToDelete._id);
            setBoardToDelete(null);
            setIsOpen(false);
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
                                key={board._id}
                                className={`flex items-center justify-between p-2 hover:bg-accent cursor-pointer ${currentBoard?._id === board._id ? "bg-accent" : ""
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
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreVertical className="w-3 h-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setBoardToDelete(board);
                                            }}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Board
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!boardToDelete} onOpenChange={() => setBoardToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Board</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{boardToDelete?.name}"? This action cannot be undone.
                            All cards, connections, and comments in this board will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteBoard}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Board
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};