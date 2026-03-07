import { Board } from "./components/board/Board";
import { Header } from "./components/Header";
import { BoardTabs } from "./components/BoardTabs";
import { WelcomeModal } from "./components/WelcomeModal";
import { UndoRedoControls } from "./components/UndoRedoControls";
import { OwlBuddy } from "./components/OwlBuddy";
import { ListView } from "./components/ListView";
import { CalendarView } from "./components/CalendarView";
import { useTheme } from "./theme/useTheme";

function App() {
  const { viewMode } = useTheme();

  return (
    <div className="min-h-screen bg-bg text-text transition-colors">
      <WelcomeModal />
      <Header />
      <BoardTabs />
      {viewMode === "board" && <Board />}
      {viewMode === "list" && <ListView />}
      {viewMode === "calendar" && <CalendarView />}
      {viewMode === "board" && <UndoRedoControls />}
      <OwlBuddy />
    </div>
  );
}

export default App;
