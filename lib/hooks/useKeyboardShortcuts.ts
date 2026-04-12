import { useEffect } from "react";

interface KeyboardShortcut {
  key: string; // 'Escape', 'Enter', 'k', etc.
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean; // Cmd on Mac, Win on Windows
  alt?: boolean;
  callback: (event: KeyboardEvent) => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;

        const keyMatches =
          event.key === shortcut.key ||
          event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (!keyMatches) continue;

        const ctrlMatches =
          (shortcut.ctrl ?? false) === (event.ctrlKey || event.metaKey);
        const shiftMatches = (shortcut.shift ?? false) === event.shiftKey;
        const metaMatches = (shortcut.meta ?? false) === event.metaKey;
        const altMatches = (shortcut.alt ?? false) === event.altKey;

        if (ctrlMatches && shiftMatches && metaMatches && altMatches) {
          event.preventDefault();
          shortcut.callback(event);
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
