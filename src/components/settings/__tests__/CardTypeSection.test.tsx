import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardTypeSection } from "../CardTypeSection";
import { ThemeProvider } from "../../../theme/ThemeProvider";
import { BoardsProvider } from "../../../boards/BoardsProvider";
import { BoardProvider } from "../../../board/BoardProvider";
import { CARD_TYPE_PRESETS } from "../../../constants/cardTypes";
import { STORAGE_KEYS, boardStorageKey } from "../../../constants/storage";
import { describe, beforeEach, it, expect, vi } from "vitest";

function renderSection() {
  return render(
    <BoardsProvider>
      <BoardProvider>
        <ThemeProvider>
          <CardTypeSection />
        </ThemeProvider>
      </BoardProvider>
    </BoardsProvider>,
  );
}

function expandEditor() {
  fireEvent.click(screen.getByTestId("card-type-editor-toggle"));
}

const devPreset = CARD_TYPE_PRESETS.find((p) => p.id === "development")!;
const personalPreset = CARD_TYPE_PRESETS.find((p) => p.id === "personal")!;

describe("CardTypeSection", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("rendering", () => {
    it("renders the preset selector with development as default", () => {
      renderSection();
      const select = screen.getByTestId("card-type-preset");
      expect(select).toHaveValue("development");
    });

    it("renders all default development card types", () => {
      renderSection();
      expandEditor();
      for (const type of devPreset.types) {
        expect(screen.getByDisplayValue(type.id)).toBeInTheDocument();
        expect(screen.getByDisplayValue(type.label)).toBeInTheDocument();
      }
    });

    it("renders add type button", () => {
      renderSection();
      expandEditor();
      expect(screen.getByTestId("card-type-add")).toBeInTheDocument();
    });

    it("renders a color swatch for each type", () => {
      renderSection();
      expandEditor();
      for (const type of devPreset.types) {
        expect(
          screen.getByLabelText(`Change color for ${type.label}`),
        ).toBeInTheDocument();
      }
    });

    it("renders a remove button for each type", () => {
      renderSection();
      expandEditor();
      for (const type of devPreset.types) {
        expect(
          screen.getByLabelText(`Remove ${type.label} type`),
        ).toBeInTheDocument();
      }
    });
  });

  describe("preset selection", () => {
    it("switches to personal preset", () => {
      renderSection();
      expandEditor();
      fireEvent.change(screen.getByTestId("card-type-preset"), {
        target: { value: "personal" },
      });

      for (const type of personalPreset.types) {
        expect(screen.getByDisplayValue(type.id)).toBeInTheDocument();
        expect(screen.getByDisplayValue(type.label)).toBeInTheDocument();
      }
    });

    it("retains in-use types from previous preset when switching", () => {
      // Seed board with a card using the "feat" type from the development preset
      const now = Date.now();
      localStorage.setItem(
        STORAGE_KEYS.BOARD,
        JSON.stringify({
          columns: [
            {
              id: "col-1",
              title: "To Do",
              createdAt: now,
              updatedAt: now,
              cards: [
                {
                  id: "card-1",
                  number: 1,
                  title: "A feature",
                  description: "",
                  cardTypeId: "feat",
                  dueDate: null,
                  createdAt: now,
                  updatedAt: now,
                  columnHistory: [{ columnId: "col-1", enteredAt: now }],
                },
              ],
            },
          ],
          archive: [],
        }),
      );

      renderSection();
      expandEditor();

      // Switch to personal preset
      fireEvent.change(screen.getByTestId("card-type-preset"), {
        target: { value: "personal" },
      });

      // Personal preset types should be present
      for (const type of personalPreset.types) {
        expect(screen.getByDisplayValue(type.id)).toBeInTheDocument();
      }

      // "feat" type should be retained because a card uses it
      expect(screen.getByDisplayValue("feat")).toBeInTheDocument();
    });

    it("switches to custom without changing types", () => {
      renderSection();
      expandEditor();
      fireEvent.change(screen.getByTestId("card-type-preset"), {
        target: { value: "custom" },
      });

      expect(screen.getByTestId("card-type-preset")).toHaveValue("custom");
      // Types should remain as development defaults
      for (const type of devPreset.types) {
        expect(screen.getByDisplayValue(type.id)).toBeInTheDocument();
      }
    });
  });

  describe("editing types", () => {
    it("updates label and switches to custom preset", async () => {
      const user = userEvent.setup();
      renderSection();
      expandEditor();

      const labelInput = screen.getByTestId("card-type-label-0");
      await user.clear(labelInput);
      await user.type(labelInput, "Story");

      expect(screen.getByTestId("card-type-preset")).toHaveValue("custom");
      expect(labelInput).toHaveValue("Story");
    });

    it("updates type ID and switches to custom preset", async () => {
      const user = userEvent.setup();
      renderSection();
      expandEditor();

      const idInput = screen.getByTestId("card-type-id-0");
      await user.clear(idInput);
      await user.type(idInput, "story");

      expect(screen.getByTestId("card-type-preset")).toHaveValue("custom");
      expect(idInput).toHaveValue("story");
    });

    it("does not call renameCardType on every keystroke — only on blur", async () => {
      // Seed board with a card using "feat" so we can check localStorage
      const now = Date.now();
      localStorage.setItem(
        STORAGE_KEYS.BOARD,
        JSON.stringify({
          columns: [
            {
              id: "col-1",
              title: "To Do",
              createdAt: now,
              updatedAt: now,
              cards: [
                {
                  id: "card-1",
                  number: 1,
                  title: "A feature",
                  description: "",
                  cardTypeId: "feat",
                  dueDate: null,
                  createdAt: now,
                  updatedAt: now,
                  columnHistory: [{ columnId: "col-1", enteredAt: now }],
                },
              ],
            },
          ],
          archive: [],
        }),
      );

      const user = userEvent.setup();
      renderSection();
      expandEditor();

      const idInput = screen.getByTestId("card-type-id-0");
      await user.clear(idInput);
      await user.type(idInput, "story");

      // While typing, the card should still have cardTypeId "feat" in localStorage
      // because renameCardType hasn't been called yet
      const boardDuringTyping = JSON.parse(
        localStorage.getItem(boardStorageKey("default")) ?? "{}",
      );
      expect(boardDuringTyping.columns[0].cards[0].cardTypeId).toBe("feat");

      // Now blur to trigger the rename
      await user.tab();

      // After blur, the card should be renamed to "story"
      // Wait for state to settle
      await vi.waitFor(() => {
        const boardAfterBlur = JSON.parse(
          localStorage.getItem(boardStorageKey("default")) ?? "{}",
        );
        expect(boardAfterBlur.columns[0].cards[0].cardTypeId).toBe("story");
      });
    });

    it("reverts type ID on blur when it duplicates another type", async () => {
      const user = userEvent.setup();
      renderSection();
      expandEditor();

      // Type "fix" into the first type's ID input — "fix" already exists as type[1]
      const idInput = screen.getByTestId("card-type-id-0");
      await user.clear(idInput);
      await user.type(idInput, "fix");
      await user.tab(); // blur

      // Should revert to the original ID "feat"
      await vi.waitFor(() => {
        expect(screen.getByTestId("card-type-id-0")).toHaveValue("feat");
      });
    });

    it("shows red border on duplicate type ID while editing", async () => {
      const user = userEvent.setup();
      renderSection();
      expandEditor();

      const idInput = screen.getByTestId("card-type-id-0");
      await user.clear(idInput);
      await user.type(idInput, "fix");

      // The input should have a red border class
      expect(idInput.className).toContain("border-red-500");
    });
  });

  describe("removing types", () => {
    it("removes a type and switches to custom preset", () => {
      renderSection();
      expandEditor();
      const initialCount = devPreset.types.length;

      fireEvent.click(screen.getByTestId("card-type-remove-0"));

      expect(screen.getByTestId("card-type-preset")).toHaveValue("custom");
      // One fewer type should be rendered
      const remaining = screen.queryAllByTestId(/^card-type-id-/);
      expect(remaining).toHaveLength(initialCount - 1);
      // The removed type's ID should no longer appear
      expect(
        screen.queryByDisplayValue(devPreset.types[0].id),
      ).not.toBeInTheDocument();
    });

    it("does not clear card cardTypeId when removing a type definition", () => {
      // Seed board with a card using the "feat" type
      const now = Date.now();
      localStorage.setItem(
        STORAGE_KEYS.BOARD,
        JSON.stringify({
          columns: [
            {
              id: "col-1",
              title: "To Do",
              createdAt: now,
              updatedAt: now,
              cards: [
                {
                  id: "card-1",
                  number: 1,
                  title: "A feature",
                  description: "",
                  cardTypeId: "feat",
                  dueDate: null,
                  createdAt: now,
                  updatedAt: now,
                  columnHistory: [{ columnId: "col-1", enteredAt: now }],
                },
              ],
            },
          ],
          archive: [],
        }),
      );

      renderSection();
      expandEditor();

      // Remove the "feat" type (index 0)
      fireEvent.click(screen.getByTestId("card-type-remove-0"));

      // Card should still have cardTypeId "feat" — type definition
      // removal should not wipe card data
      const board = JSON.parse(
        localStorage.getItem(boardStorageKey("default")) ?? "{}",
      );
      expect(board.columns[0].cards[0].cardTypeId).toBe("feat");
    });
  });

  describe("adding types", () => {
    it("adds a new type with default values and switches to custom preset", () => {
      renderSection();
      expandEditor();
      const initialCount = devPreset.types.length;

      fireEvent.click(screen.getByTestId("card-type-add"));

      expect(screen.getByTestId("card-type-preset")).toHaveValue("custom");
      const allTypeIds = screen.queryAllByTestId(/^card-type-id-/);
      expect(allTypeIds).toHaveLength(initialCount + 1);
      // New type has default id "new" and label "New Type"
      expect(screen.getByDisplayValue("new")).toBeInTheDocument();
      expect(screen.getByDisplayValue("New Type")).toBeInTheDocument();
    });

    it("picks the first unused color for a new type", () => {
      renderSection();
      expandEditor();

      fireEvent.click(screen.getByTestId("card-type-add"));

      // The new type should have a color swatch button
      const newColorButton = screen.getByLabelText("Change color for New Type");
      expect(newColorButton).toBeInTheDocument();
    });
  });

  describe("default card type", () => {
    it("renders default type dropdown", () => {
      renderSection();
      expect(screen.getByTestId("default-card-type")).toBeInTheDocument();
    });

    it("shows None and all card types as options", () => {
      renderSection();
      const select = screen.getByTestId(
        "default-card-type",
      ) as HTMLSelectElement;
      const options = Array.from(select.options);

      // "None" + all dev preset types
      expect(options).toHaveLength(devPreset.types.length + 1);
      expect(options[0].textContent).toBe("None");
      expect(options[0].value).toBe("");
    });

    it("defaults to None", () => {
      renderSection();
      expect(screen.getByTestId("default-card-type")).toHaveValue("");
    });

    it("sets default type when selected", () => {
      renderSection();
      fireEvent.change(screen.getByTestId("default-card-type"), {
        target: { value: devPreset.types[0].id },
      });

      expect(screen.getByTestId("default-card-type")).toHaveValue(
        devPreset.types[0].id,
      );
    });

    it("clears default type when None is selected", () => {
      renderSection();
      // First set a type
      fireEvent.change(screen.getByTestId("default-card-type"), {
        target: { value: devPreset.types[0].id },
      });
      // Then clear it
      fireEvent.change(screen.getByTestId("default-card-type"), {
        target: { value: "" },
      });

      expect(screen.getByTestId("default-card-type")).toHaveValue("");
    });
  });

  describe("color picker", () => {
    it("opens color picker when swatch is clicked", () => {
      renderSection();
      expandEditor();
      const swatch = screen.getByLabelText(
        `Change color for ${devPreset.types[0].label}`,
      );

      fireEvent.click(swatch);

      // Should show color palette buttons
      const colorButtons = screen.getAllByLabelText(/^Color #/);
      expect(colorButtons.length).toBeGreaterThan(0);
    });

    it("closes color picker when swatch is clicked again", () => {
      renderSection();
      expandEditor();
      const swatch = screen.getByLabelText(
        `Change color for ${devPreset.types[0].label}`,
      );

      fireEvent.click(swatch);
      expect(screen.getAllByLabelText(/^Color #/).length).toBeGreaterThan(0);

      fireEvent.click(swatch);
      expect(screen.queryAllByLabelText(/^Color #/)).toHaveLength(0);
    });

    it("changes color and closes picker when a color is selected", () => {
      renderSection();
      expandEditor();
      const swatch = screen.getByLabelText(
        `Change color for ${devPreset.types[0].label}`,
      );

      fireEvent.click(swatch);

      // Pick the first color button
      const colorButtons = screen.getAllByLabelText(/^Color #/);
      fireEvent.click(colorButtons[0]);

      // Picker should close
      expect(screen.queryAllByLabelText(/^Color #/)).toHaveLength(0);
      // Preset should switch to custom
      expect(screen.getByTestId("card-type-preset")).toHaveValue("custom");
    });

    it("only shows one color picker at a time", () => {
      renderSection();
      expandEditor();
      const swatch0 = screen.getByLabelText(
        `Change color for ${devPreset.types[0].label}`,
      );
      const swatch1 = screen.getByLabelText(
        `Change color for ${devPreset.types[1].label}`,
      );

      fireEvent.click(swatch0);
      const firstPickers = screen.getAllByLabelText(/^Color #/);

      fireEvent.click(swatch1);
      const secondPickers = screen.getAllByLabelText(/^Color #/);

      // Same number of color buttons (one palette, not two)
      expect(secondPickers).toHaveLength(firstPickers.length);
    });
  });
});
