import { Board } from "./components/Board";
import { Header } from "./components/Header";

function App() {
  return (
    <div className="min-h-screen bg-bg-light text-text-light dark:bg-bg-dark dark:text-text-dark transition-colors">
      <Header />
      <main className="mx-auto px-4 py-6">
        <Board />
      </main>
    </div>
  );
}

export default App;
