import { Board } from "./components/Board";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { WelcomeModal } from "./components/WelcomeModal";

function App() {
  return (
    <div className="min-h-screen bg-bg-light text-text-light dark:bg-bg-dark dark:text-text-dark transition-colors">
      <WelcomeModal />
      <Header />
      <main className="mx-auto px-4 py-6 pb-16">
        <Board />
      </main>
      <Footer />
    </div>
  );
}

export default App;
