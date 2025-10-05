import { useEffect } from "react";

interface KeyboardShortcuts {
  onAddNote: () => void;
  onAddCharacter: () => void;
  onAddLocation: () => void;
  onAddPlot?: () => void;
  onAddItem?: () => void;
  onToggleConnection: () => void;
  onSearch: () => void;
  onComment: () => void;
  onSave: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'n':
            event.preventDefault();
            shortcuts.onAddNote();
            break;
          case 'c':
            event.preventDefault();
            shortcuts.onAddCharacter();
            break;
          case 'l':
            event.preventDefault();
            shortcuts.onAddLocation();
            break;
          case 'p':
            event.preventDefault();
            shortcuts.onAddPlot?.();
            break;
          case 'i':
            event.preventDefault();
            shortcuts.onAddItem?.();
            break;
          case 'k':
            event.preventDefault();
            shortcuts.onToggleConnection();
            break;
          case 'f':
            event.preventDefault();
            shortcuts.onSearch();
            break;
          case '/':
            event.preventDefault();
            shortcuts.onComment();
            break;
          case 's':
            event.preventDefault();
            shortcuts.onSave();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};