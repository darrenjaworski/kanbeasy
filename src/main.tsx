import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppLoader } from "./components/AppLoader";
import { ThemeProvider } from "./theme/ThemeProvider";
import { BoardProvider } from "./board/BoardProvider";
import { ClipboardProvider } from "./board/ClipboardProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppLoader>
      <ThemeProvider>
        <BoardProvider>
          <ClipboardProvider>
            <App />
          </ClipboardProvider>
        </BoardProvider>
      </ThemeProvider>
    </AppLoader>
  </StrictMode>,
);
