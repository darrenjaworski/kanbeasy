import { render } from "@testing-library/react";
import App from "../App";
import { BoardsProvider } from "../boards/BoardsProvider";
import { BoardProvider } from "../board/BoardProvider";
import { ClipboardProvider } from "../board/ClipboardProvider";
import { ThemeProvider } from "../theme/ThemeProvider";

export function renderApp() {
  return render(
    <ThemeProvider>
      <BoardsProvider>
        <BoardProvider>
          <ClipboardProvider>
            <App />
          </ClipboardProvider>
        </BoardProvider>
      </BoardsProvider>
    </ThemeProvider>,
  );
}
