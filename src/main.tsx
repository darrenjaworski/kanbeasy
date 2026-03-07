import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./theme/ThemeProvider";
import { BoardsProvider } from "./boards/BoardsProvider";
import { BoardProvider } from "./board/BoardProvider";
import { ClipboardProvider } from "./board/ClipboardProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BoardsProvider>
        <BoardProvider>
          <ClipboardProvider>
            <App />
          </ClipboardProvider>
        </BoardProvider>
      </BoardsProvider>
    </ThemeProvider>
  </StrictMode>,
);
