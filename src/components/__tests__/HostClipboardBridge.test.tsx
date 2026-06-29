import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HostClipboardBridge } from "../HostClipboardBridge";
import {
  setHostModeForTesting,
  resetHostBridgeForTesting,
} from "../../utils/hostBridge";

function Harness() {
  return (
    <div>
      <input data-testid="field" defaultValue="hello world" />
      <HostClipboardBridge />
    </div>
  );
}

const clipboard = {
  text: "",
  readText: vi.fn(),
  writeText: vi.fn(),
};

beforeEach(() => {
  clipboard.text = "PASTED";
  clipboard.readText = vi.fn(async () => clipboard.text);
  clipboard.writeText = vi.fn(async (t: string) => {
    clipboard.text = t;
  });
  Object.defineProperty(navigator, "clipboard", {
    value: clipboard,
    configurable: true,
  });
});

afterEach(() => {
  resetHostBridgeForTesting();
  setHostModeForTesting(false);
  vi.restoreAllMocks();
});

describe("HostClipboardBridge in host mode", () => {
  beforeEach(() => setHostModeForTesting(true));

  it("pastes clipboard text at the caret on Cmd/Ctrl+V", async () => {
    render(<Harness />);
    const field = screen.getByTestId("field") as HTMLInputElement;
    field.focus();
    field.setSelectionRange(5, 5); // after "hello"

    fireEvent.keyDown(field, { key: "v", ctrlKey: true });

    await waitFor(() => expect(field.value).toBe("helloPASTED world"));
    expect(clipboard.readText).toHaveBeenCalled();
  });

  it("copies the selection on Cmd/Ctrl+C without mutating the field", async () => {
    render(<Harness />);
    const field = screen.getByTestId("field") as HTMLInputElement;
    field.focus();
    field.setSelectionRange(0, 5); // "hello"

    fireEvent.keyDown(field, { key: "c", metaKey: true });

    await waitFor(() =>
      expect(clipboard.writeText).toHaveBeenCalledWith("hello"),
    );
    expect(field.value).toBe("hello world");
  });

  it("cuts the selection on Cmd/Ctrl+X", async () => {
    render(<Harness />);
    const field = screen.getByTestId("field") as HTMLInputElement;
    field.focus();
    field.setSelectionRange(5, 11); // " world"

    fireEvent.keyDown(field, { key: "x", ctrlKey: true });

    await waitFor(() => expect(field.value).toBe("hello"));
    expect(clipboard.writeText).toHaveBeenCalledWith(" world");
  });

  it("selects all on Cmd/Ctrl+A", () => {
    render(<Harness />);
    const field = screen.getByTestId("field") as HTMLInputElement;
    field.focus();
    field.setSelectionRange(0, 0);

    fireEvent.keyDown(field, { key: "a", ctrlKey: true });

    expect(field.selectionStart).toBe(0);
    expect(field.selectionEnd).toBe(11);
  });

  it("opens a context menu on right-click and pastes via the menu", async () => {
    render(<Harness />);
    const field = screen.getByTestId("field") as HTMLInputElement;
    field.setSelectionRange(11, 11); // end

    fireEvent.contextMenu(field, { clientX: 10, clientY: 10 });

    const menu = await screen.findByTestId("host-clipboard-menu");
    fireEvent.click(screen.getByRole("menuitem", { name: "Paste" }));

    await waitFor(() => expect(field.value).toBe("hello worldPASTED"));
    expect(menu).not.toBeInTheDocument();
  });

  it("disables Cut/Copy in the menu when nothing is selected", () => {
    render(<Harness />);
    const field = screen.getByTestId("field") as HTMLInputElement;
    field.setSelectionRange(3, 3);

    fireEvent.contextMenu(field, { clientX: 10, clientY: 10 });

    expect(screen.getByRole("menuitem", { name: "Cut" })).toBeDisabled();
    expect(screen.getByRole("menuitem", { name: "Copy" })).toBeDisabled();
    expect(screen.getByRole("menuitem", { name: "Paste" })).toBeEnabled();
  });

  it("closes the menu on Escape", async () => {
    render(<Harness />);
    const field = screen.getByTestId("field") as HTMLInputElement;

    fireEvent.contextMenu(field, { clientX: 10, clientY: 10 });
    expect(screen.getByTestId("host-clipboard-menu")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() =>
      expect(
        screen.queryByTestId("host-clipboard-menu"),
      ).not.toBeInTheDocument(),
    );
  });
});

describe("HostClipboardBridge outside host mode", () => {
  beforeEach(() => setHostModeForTesting(false));

  it("does not intercept right-click (renders nothing)", () => {
    render(<Harness />);
    const field = screen.getByTestId("field") as HTMLInputElement;

    fireEvent.contextMenu(field, { clientX: 10, clientY: 10 });

    expect(screen.queryByTestId("host-clipboard-menu")).not.toBeInTheDocument();
  });

  it("does not intercept Cmd/Ctrl+V", () => {
    render(<Harness />);
    const field = screen.getByTestId("field") as HTMLInputElement;
    field.focus();
    field.setSelectionRange(5, 5);

    fireEvent.keyDown(field, { key: "v", ctrlKey: true });

    expect(clipboard.readText).not.toHaveBeenCalled();
  });
});
