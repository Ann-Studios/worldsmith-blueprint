import { PanelLeftClose, PanelLeft, FolderOpen } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const projects = [
    { id: "1", name: "Fantasy Novel", color: "bg-primary" },
    { id: "2", name: "Sci-Fi Game", color: "bg-secondary" },
    { id: "3", name: "Mystery Series", color: "bg-accent" },
  ];

  return (
    <div
      className={cn(
        "h-full border-r bg-card transition-all duration-300 flex flex-col",
        isOpen ? "w-64" : "w-0"
      )}
    >
      {isOpen && (
        <>
          <div className="h-16 border-b flex items-center justify-between px-4">
            <h2 className="font-semibold text-lg">Projects</h2>
            <Button variant="ghost" size="icon" onClick={onToggle}>
              <PanelLeftClose className="w-5 h-5" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1 px-3 py-4">
            <div className="space-y-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className={cn("w-3 h-3 rounded-full", project.color)} />
                  <span className="text-sm font-medium">{project.name}</span>
                </button>
              ))}
              
              <button className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors text-left mt-4">
                <FolderOpen className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">New Project</span>
              </button>
            </div>
          </ScrollArea>
        </>
      )}
      
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="m-2"
        >
          <PanelLeft className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};
