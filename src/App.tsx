import { Board } from "./components/Board";
import { Header } from "./components/Header";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-light text-text-light dark:bg-bg-dark dark:text-text-dark transition-colors">
      <Header />
      <main className="mx-auto px-4 py-6 flex-1 min-h-0">
        <Board />
      </main>
    </div>
  );
}

export default App;
