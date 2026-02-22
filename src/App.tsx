import { Board } from "./components/Board";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { WelcomeModal } from "./components/WelcomeModal";
import { UndoRedoControls } from "./components/UndoRedoControls";
import { OwlBuddy } from "./components/OwlBuddy";

function App() {
  return (
    <div className="min-h-screen bg-bg text-text transition-colors">
      <WelcomeModal />
      <Header />
      <Board />
      <UndoRedoControls />
      <OwlBuddy />
      <Footer />
    </div>
  );
}

export default App;
