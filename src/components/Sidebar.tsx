import { PanelLeftClose, PanelLeft, Trash2, Download, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import worldsmithLogo from "@/assets/worldsmith-logo.png";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Sidebar = ({ isOpen, onToggle, onClear, onExport, onImport }: SidebarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        "h-full border-r bg-card transition-all duration-300 flex flex-col",
        isOpen ? "w-64" : "w-0"
      )}
    >
      {isOpen && (
        <>
          <div className="border-b flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={worldsmithLogo} alt="WorldSmith Logo" className="w-8 h-8" />
                <h1 className="font-bold text-xl bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  WorldSmith
                </h1>
              </div>
              <Button variant="ghost" size="icon" onClick={onToggle}>
                <PanelLeftClose className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Visual Story Planning</p>
          </div>
          
          <ScrollArea className="flex-1 px-3 py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2 px-3">Canvas Management</h3>
                <p className="text-xs text-muted-foreground mb-4 px-3">
                  Auto-saves to browser storage
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={onExport}
                >
                  <Download className="w-4 h-4" />
                  Export Canvas
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" />
                  Import Canvas
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={onImport}
                  className="hidden"
                />

                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                  onClick={onClear}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Canvas
                </Button>
              </div>
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
