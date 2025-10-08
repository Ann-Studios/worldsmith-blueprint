import { PanelLeftClose, PanelLeft, Trash2, Download, Upload, Save } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import worldsmithLogo from "@/assets/worldsmith-logo.png";
import { ThemeToggle } from "./ThemeToggle";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSave?: () => void;
}

export const Sidebar = ({ isOpen, onToggle, onClear, onExport, onImport, onSave }: SidebarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        "h-full border-r bg-card transition-all duration-300 flex flex-col",
        isOpen ? "w-64" : "w-16"
      )}
    >
      {isOpen && (
        <>
          <div className="border-b flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={worldsmithLogo} alt="WorldSmith Logo" className="h-6" onClick={() => window.location.href = '/'} />
              </div>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <Button variant="ghost" size="icon" onClick={onToggle}>
                  <PanelLeftClose className="w-5 h-5" />
                </Button>
              </div>
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
                {onSave && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={onSave}
                  >
                    <Save className="w-4 h-4" />
                    Save Now
                  </Button>
                )}

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
                  title="file"
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