import { render } from "@testing-library/react";
import App from "../App";
import { BoardProvider } from "../board/BoardProvider";
import { ClipboardProvider } from "../board/ClipboardProvider";
import { ThemeProvider } from "../theme/ThemeProvider";

export function renderApp() {
  return render(
    <ThemeProvider>
      <BoardProvider>
        <ClipboardProvider>
          <App />
        </ClipboardProvider>
      </BoardProvider>
    </ThemeProvider>,
  );
}
