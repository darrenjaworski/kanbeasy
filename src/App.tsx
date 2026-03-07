import { useCallback, useState } from "react";
import { Board } from "./components/board/Board";
import { CommandPalette } from "./components/CommandPalette";
import { KeyboardShortcutHint } from "./components/KeyboardShortcutHint";
import { Header } from "./components/Header";
import { WelcomeModal } from "./components/WelcomeModal";
import { UndoRedoControls } from "./components/UndoRedoControls";
import { OwlBuddy } from "./components/OwlBuddy";
import { ListView } from "./components/ListView";
import { CalendarView } from "./components/CalendarView";
import { useTheme } from "./theme/useTheme";
import { useCommandPaletteShortcut } from "./hooks";

function App() {
  const { viewMode, keyboardShortcutsEnabled } = useTheme();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useCommandPaletteShortcut(
    useCallback(() => {
      if (!keyboardShortcutsEnabled) return;
      setCommandPaletteOpen((prev) => !prev);
    }, [keyboardShortcutsEnabled]),
  );

  return (
    <div className="min-h-screen bg-bg text-text transition-colors">
      <WelcomeModal />
      <Header />
      {viewMode === "board" && <Board />}
      {viewMode === "list" && <ListView />}
      {viewMode === "calendar" && <CalendarView />}
      {viewMode === "board" && <UndoRedoControls />}
      <OwlBuddy />
      {keyboardShortcutsEnabled && <KeyboardShortcutHint />}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}

export default App;
