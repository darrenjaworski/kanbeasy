import { Board } from "./components/board/Board";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { WelcomeModal } from "./components/WelcomeModal";
import { UndoRedoControls } from "./components/UndoRedoControls";
import { OwlBuddy } from "./components/OwlBuddy";
import { ListView } from "./components/ListView";
import { useTheme } from "./theme/useTheme";

function App() {
  const { viewMode } = useTheme();

  return (
    <div className="min-h-screen bg-bg text-text transition-colors">
      <WelcomeModal />
      <Header />
      {viewMode === "board" ? <Board /> : <ListView />}
      {viewMode === "board" && <UndoRedoControls />}
      <OwlBuddy />
      <Footer />
    </div>
  );
}

export default App;
