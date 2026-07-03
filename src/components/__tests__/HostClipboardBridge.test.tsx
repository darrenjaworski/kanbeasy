import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HostClipboardBridge } from "../HostClipboardBridge";
import {
  MESSAGE_SOURCE,
  PROTOCOL_VERSION,
  setHostCapabilitiesForTesting,
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

/**
 * Simulates the VS Code extension side of the bridge: answers
 * host:clipboard:read / host:clipboard:write messages the way
 * reduceWebviewMessage does (backed by vscode.env.clipboard there).
 * In jsdom window.parent === window, so the app's postToHost lands here.
 */
function installFakeHost(hostClipboard: { text: string; written: string[] }) {
  function onMessage(event: MessageEvent) {
    const data = event.data as
      | { source?: string; type?: string; payload?: unknown }
      | undefined;
    if (!data || data.source !== MESSAGE_SOURCE) return;
    if (data.type === "host:clipboard:write") {
      const { text } = data.payload as { text: string };
      hostClipboard.text = text;
      hostClipboard.written.push(text);
    }
    if (data.type === "host:clipboard:read") {
      const { requestId } = data.payload as { requestId: string };
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: "",
          data: {
            source: MESSAGE_SOURCE,
            protocolVersion: PROTOCOL_VERSION,
            type: "host:clipboard:readResult",
            payload: { requestId, text: hostClipboard.text },
          },
        }),
      );
    }
  }
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

beforeEach(() => {
  clipboard.text = "NAVIGATOR";
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

describe("HostClipboardBridge in host mode with clipboard capability", () => {
  const hostClipboard = { text: "", written: [] as string[] };
  let uninstallFakeHost: () => void;

  beforeEach(() => {
    setHostModeForTesting(true);
    setHostCapabilitiesForTesting({ clipboard: true });
    hostClipboard.text = "PASTED";
    hostClipboard.written = [];
    uninstallFakeHost = installFakeHost(hostClipboard);
  });

  afterEach(() => {
    uninstallFakeHost();
  });

  it("pastes host clipboard text at the caret on Cmd/Ctrl+V", async () => {
    render(<Harness />);
    const field = screen.getByTestId("field") as HTMLInputElement;
    field.focus();
    field.setSelectionRange(5, 5); // after "hello"

    fireEvent.keyDown(field, { key: "v", ctrlKey: true });

    await waitFor(() => expect(field.value).toBe("helloPASTED world"));
    // Host-mediated: the browser Clipboard API must not be touched.
    expect(clipboard.readText).not.toHaveBeenCalled();
  });

  it("copies the selection to the host clipboard on Cmd/Ctrl+C without mutating the field", async () => {
    render(<Harness />);
    const field = screen.getByTestId("field") as HTMLInputElement;
    field.focus();
    field.setSelectionRange(0, 5); // "hello"

    fireEvent.keyDown(field, { key: "c", metaKey: true });

    await waitFor(() => expect(hostClipboard.written).toContain("hello"));
    expect(field.value).toBe("hello world");
    expect(clipboard.writeText).not.toHaveBeenCalled();
  });

  it("cuts the selection to the host clipboard on Cmd/Ctrl+X", async () => {
    render(<Harness />);
    const field = screen.getByTestId("field") as HTMLInputElement;
    field.focus();
    field.setSelectionRange(5, 11); // " world"

    fireEvent.keyDown(field, { key: "x", ctrlKey: true });

    await waitFor(() => expect(field.value).toBe("hello"));
    expect(hostClipboard.written).toContain(" world");
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

describe("HostClipboardBridge in host mode without clipboard capability", () => {
  beforeEach(() => {
    setHostModeForTesting(true);
    // No capability set — models an old extension version whose host:init
    // carries no capabilities. The bridge must stay completely inert so a
    // web-app deploy can never break paste for not-yet-updated extensions.
  });

  it("does not intercept right-click", () => {
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

  it("activates once the host advertises the clipboard capability", async () => {
    render(<Harness />);
    const field = screen.getByTestId("field") as HTMLInputElement;

    fireEvent.contextMenu(field, { clientX: 10, clientY: 10 });
    expect(screen.queryByTestId("host-clipboard-menu")).not.toBeInTheDocument();

    act(() => {
      setHostCapabilitiesForTesting({ clipboard: true });
    });

    fireEvent.contextMenu(field, { clientX: 10, clientY: 10 });
    expect(
      await screen.findByTestId("host-clipboard-menu"),
    ).toBeInTheDocument();
  });
});

describe("HostClipboardBridge outside host mode", () => {
  beforeEach(() => {
    setHostModeForTesting(false);
    setHostCapabilitiesForTesting({ clipboard: true });
  });

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
